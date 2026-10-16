import { describe, expect, it } from "vitest";
import { buildCompose, buildDockerfile, dockerfileDefaults, estimatedSize } from "@/tools/nextjs-dockerfile-generator/lib/dockerfile";

describe("buildDockerfile", () => {
  it.each(["npm", "pnpm", "yarn", "bun"] as const)("writes a multi-stage file for %s", (packageManager) => {
    const file = buildDockerfile({ ...dockerfileDefaults, packageManager, prisma: true, migrate: true, base: "alpine" });
    expect(file).toContain("AS deps");
    expect(file).toContain("AS builder");
    expect(file).toContain("AS runner");
    expect(file).toContain("USER nextjs");
    expect(file).toContain("prisma generate");
    expect(file).toContain(packageManager === "npm" ? "npm ci" : packageManager);
    expect(buildCompose({ ...dockerfileDefaults, prisma: true })).toContain("postgres");
    expect(estimatedSize({ ...dockerfileDefaults, base: "alpine" })).toContain("150");
  });
});
