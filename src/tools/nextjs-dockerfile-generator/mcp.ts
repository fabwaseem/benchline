import { z } from "zod";
import {
  buildCommands,
  buildCompose,
  buildDockerfile,
  buildDockerignore,
  buildNextConfig,
  dockerfileDefaults,
  estimatedSize,
  imageTag,
} from "@/tools/nextjs-dockerfile-generator/lib/dockerfile";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  packageManager: z.enum(["npm", "pnpm", "yarn", "bun"]).default(dockerfileDefaults.packageManager),
  node: z.enum(["20", "22", "24"]).default(dockerfileDefaults.node),
  base: z.enum(["alpine", "slim"]).default(dockerfileDefaults.base),
  standalone: z.boolean().default(dockerfileDefaults.standalone),
  prisma: z.boolean().default(dockerfileDefaults.prisma),
  migrate: z.boolean().default(dockerfileDefaults.migrate),
  healthcheck: z.boolean().default(dockerfileDefaults.healthcheck),
  healthPath: z.string().default(dockerfileDefaults.healthPath),
  port: z.number().int().min(1).max(65535).default(dockerfileDefaults.port),
  publicEnvs: z.array(z.string()).default([]),
  telemetryDisabled: z.boolean().default(dockerfileDefaults.telemetryDisabled),
  cacheMounts: z.boolean().default(dockerfileDefaults.cacheMounts),
  turbo: z.boolean().default(dockerfileDefaults.turbo),
});

export const outputSchema = z.object({
  dockerfile: z.string(),
  dockerignore: z.string(),
  compose: z.string(),
  nextConfig: z.string(),
  commands: z.string(),
  estimatedSize: z.string(),
  image: z.string(),
});

async function run(input: unknown) {
  const options = inputSchema.parse(input);
  return outputSchema.parse({
    dockerfile: buildDockerfile(options),
    dockerignore: buildDockerignore(),
    compose: buildCompose(options),
    nextConfig: buildNextConfig(options),
    commands: buildCommands(options),
    estimatedSize: estimatedSize(options),
    image: imageTag(options),
  });
}

export const tool: BenchTool = {
  slug: "nextjs-dockerfile-generator",
  name: "build_nextjs_dockerfile",
  title: "Build a Next.js Dockerfile",
  description: "Generate a production Dockerfile, dockerignore, compose file, and next.config snippet for a Next.js app. Defaults match a pnpm standalone image.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
