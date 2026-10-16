export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";
export type NodeVersion = "20" | "22" | "24";
export type BaseImage = "alpine" | "slim";

export type DockerfileOptions = {
  packageManager: PackageManager;
  node: NodeVersion;
  base: BaseImage;
  standalone: boolean;
  prisma: boolean;
  migrate: boolean;
  healthcheck: boolean;
  healthPath: string;
  port: number;
  publicEnvs: string[];
  telemetryDisabled: boolean;
  cacheMounts: boolean;
  turbo: boolean;
};

export const dockerfileDefaults: DockerfileOptions = {
  packageManager: "pnpm",
  node: "22",
  base: "slim",
  standalone: true,
  prisma: false,
  migrate: false,
  healthcheck: true,
  healthPath: "/api/health",
  port: 3000,
  publicEnvs: [],
  telemetryDisabled: true,
  cacheMounts: true,
  turbo: false,
};

export function imageTag(options: DockerfileOptions) {
  return options.base === "alpine" ? `node:${options.node}-alpine` : `node:${options.node}-bookworm-slim`;
}

export function estimatedSize(options: DockerfileOptions) {
  if (options.standalone && options.base === "alpine") return "about 150–200 MB";
  if (options.standalone) return "about 220–280 MB";
  if (options.base === "alpine") return "about 800 MB";
  return "about 1 GB";
}

export function buildDockerfile(options: DockerfileOptions) {
  const image = imageTag(options);
  const pm = options.packageManager;
  const envs = options.publicEnvs.filter(Boolean);
  const argLines = envs.map((name) => `ARG ${name}`).join("\n");
  const envLines = envs.map((name) => `ENV ${name}=\${${name}}`).join("\n");
  const install = installCommand(pm, options.cacheMounts);
  const build = buildCommand(pm);
  const prisma = options.prisma ? "\nRUN npx prisma generate" : "";
  const telemetry = options.telemetryDisabled ? "ENV NEXT_TELEMETRY_DISABLED=1\n" : "";
  const corepack = pm === "pnpm" || pm === "yarn" ? "RUN corepack enable\n" : "";
  const alpine = options.base === "alpine" ? "RUN apk add --no-cache libc6-compat\n" : "";
  const health = options.healthcheck
    ? `HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \\\n  CMD node -e "fetch('http://127.0.0.1:${options.port}${options.healthPath}').then((res) => process.exit(res.ok ? 0 : 1)).catch(() => process.exit(1))"\n`
    : "";
  const migrate = options.prisma && options.migrate
    ? `CMD ["sh", "-c", "npx prisma migrate deploy && ${options.standalone ? "node server.js" : `${runBin(pm)} start`}"]\n`
    : `CMD ${options.standalone ? '["node", "server.js"]' : startCmd(pm)}\n`;
  const runnerCopy = options.standalone
    ? `COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./\nCOPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static\nCOPY --from=builder --chown=nextjs:nodejs /app/public ./public\n`
    : `COPY --from=builder --chown=nextjs:nodejs /app ./\n`;
  const turbo = options.turbo
    ? `# Monorepo: run \`turbo prune <app> --docker\` before the dependency stage and copy the pruned out/ directory.\n`
    : "";

  return `${turbo}FROM ${image} AS deps
WORKDIR /app
${alpine}${corepack}${telemetry}${argLines ? `${argLines}\n` : ""}${envLines ? `${envLines}\n` : ""}COPY package.json pnpm-lock.yaml* package-lock.json* yarn.lock* bun.lock* ./
${install}

FROM ${image} AS builder
WORKDIR /app
${corepack}${telemetry}COPY --from=deps /app/node_modules ./node_modules
COPY . .
${envLines ? `${envLines}\n` : ""}${prisma}
RUN ${build}

FROM ${image} AS runner
WORKDIR /app
ENV NODE_ENV=production
${telemetry}ENV PORT=${options.port}
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
${runnerCopy}${health}USER nextjs
EXPOSE ${options.port}
${migrate}`;
}

function installCommand(pm: PackageManager, cache: boolean) {
  if (pm === "pnpm") return cache ? "RUN --mount=type=cache,target=/pnpm/store pnpm install --frozen-lockfile" : "RUN pnpm install --frozen-lockfile";
  if (pm === "yarn") return cache ? "RUN --mount=type=cache,target=/usr/local/share/.cache/yarn yarn install --frozen-lockfile" : "RUN yarn install --frozen-lockfile";
  if (pm === "bun") return "RUN bun install --frozen-lockfile";
  return cache ? "RUN --mount=type=cache,target=/root/.npm npm ci" : "RUN npm ci";
}

function buildCommand(pm: PackageManager) {
  if (pm === "pnpm") return "pnpm build";
  if (pm === "yarn") return "yarn build";
  if (pm === "bun") return "bun run build";
  return "npm run build";
}

function runBin(pm: PackageManager) {
  if (pm === "pnpm") return "pnpm";
  if (pm === "yarn") return "yarn";
  if (pm === "bun") return "bun run";
  return "npm run";
}

function startCmd(pm: PackageManager) {
  if (pm === "bun") return '["bun", "run", "start"]';
  return `["${pm}", "start"]`;
}

export function buildDockerignore() {
  return `node_modules
.next
.git
Dockerfile*
docker-compose*.yml
npm-debug.log*
.pnpm-debug.log*
.env*
!.env.example
coverage
*.md
`;
}

export function buildCompose(options: DockerfileOptions) {
  const postgres = options.prisma
    ? `
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    ports:
      - "5432:5432"
`
    : "";
  const depends = options.prisma ? "\n    depends_on:\n      - db" : "";
  const database = options.prisma ? "\n      DATABASE_URL: postgresql://postgres:postgres@db:5432/app" : "";
  return `services:
  app:
    build: .
    ports:
      - "${options.port}:${options.port}"
    environment:
      PORT: ${options.port}${database}${depends}
${postgres}`;
}

export function buildNextConfig(options: DockerfileOptions) {
  if (!options.standalone) return `const nextConfig = {};\n\nexport default nextConfig;\n`;
  return `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
`;
}

export function buildCommands(options: DockerfileOptions) {
  const args = options.publicEnvs.filter(Boolean).map((name) => `--build-arg ${name}=...`).join(" ");
  return [`docker build -t app ${args}`.trim(), `docker run --rm -p ${options.port}:${options.port} app`].join("\n");
}
