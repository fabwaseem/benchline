import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { tools } from "@/registry";
import { toolCover, toolLogo } from "@/lib/assets";

describe("tool artwork", () => {
  it.each(tools.map((tool) => tool.slug))("%s has a cover and a logo in public/", (slug) => {
    expect(existsSync(join(process.cwd(), "public", toolCover(slug)))).toBe(true);
    expect(existsSync(join(process.cwd(), "public", toolLogo(slug)))).toBe(true);
  });
});
