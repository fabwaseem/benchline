import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "nextjs-dockerfile-generator",
  name: "Next.js Dockerfile generator",
  tagline: "Generate a production multi-stage Dockerfile for Next.js, plus .dockerignore and compose.",
  description:
    "Free Next.js Dockerfile generator. Pick your package manager, Node version, standalone output, Prisma, and healthcheck, and get a small multi-stage Dockerfile with .dockerignore, docker-compose.yml, and next.config settings.",
  category: "nextjs",
  tags: ["docker", "nextjs"],
  keywords: ["nextjs dockerfile", "next.js docker", "standalone", "pnpm", "docker compose"],
  status: "new",
  createdAt: "2026-09-20",
  updatedAt: "2026-10-16",
  icon: "Container",
  related: ["cron-expression-builder", "og-image-generator", "schema-generator", "jwt-decoder"],
  faqs: [
    { q: "What does output: standalone do?", a: "Next.js traces the files the server needs and writes a minimal server.js plus those files to .next/standalone. The runtime image does not need a full node_modules install. You still copy public and .next/static yourself." },
    { q: "Why multi-stage?", a: "The dependency and build stages can hold the compiler and the package cache. Docker ships only the last stage, so the production image stays smaller." },
    { q: "Should I use alpine or slim?", a: "Slim is the safer default. It uses glibc, which matches sharp and most Prisma engines. Alpine is smaller and uses musl. On Alpine, set Prisma binaryTargets to a linux-musl target or the query engine will be missing." },
    { q: "How do NEXT_PUBLIC_ env vars work in Docker?", a: "Next.js inlines NEXT_PUBLIC_ values at build time, so pass them as build args. Server-only secrets are read at runtime. Do not put those secrets in ARG." },
    { q: "Why run as non-root?", a: "A non-root user limits the damage if the app is compromised. The image creates a nextjs user and gives that user ownership of the app files so the runtime cache can be written." },
    { q: "Does it work with Coolify, Railway, or Fly?", a: "Yes. Any Docker host can run the image. Expose port 3000, pass runtime env on the platform, and pass NEXT_PUBLIC_ values at build time." },
  ],
  seo: {
    title: "Next.js Dockerfile generator",
    description: "Generate a production multi-stage Dockerfile for Next.js with npm, pnpm, yarn, or bun, plus .dockerignore and compose.",
  },
  howTo: [
    { name: "Pick a package manager and Node version", text: "Choose npm, pnpm, yarn, or bun, then Node 20, 22, or 24 on Alpine or Debian slim." },
    { name: "Toggle standalone, Prisma, and the healthcheck", text: "Standalone is on by default. Prisma adds prisma generate. The healthcheck calls a route with node fetch, so the image does not need curl." },
    { name: "Copy the files and run docker build", text: "Download the Dockerfile, ignore file, and compose file, set output standalone in next.config, then build and run." },
  ],
  inputs: "Package manager, Node version, base image, standalone, Prisma, healthcheck, port, and build-time env names.",
  outputs: "Dockerfile, .dockerignore, docker-compose.yml, a next.config snippet, and build commands. A zip of the files.",
  runsLocally: true,
} satisfies ToolMeta;
