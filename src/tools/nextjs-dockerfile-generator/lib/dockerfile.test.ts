import { describe, expect, it } from "vitest";
import { buildArgWarnings, buildCompose, buildDockerfile, dockerfileDefaults, estimatedSize } from "@/tools/nextjs-dockerfile-generator/lib/dockerfile";

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

  it("warns when a build arg is not a NEXT_PUBLIC_ name", () => {
    expect(buildArgWarnings(["NEXT_PUBLIC_SITE", "DATABASE_URL"])).toEqual(["DATABASE_URL would be baked into the image."]);
    expect(buildArgWarnings(["NEXT_PUBLIC_SITE"])).toEqual([]);
  });
});
