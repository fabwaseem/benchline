import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { tools } from "@/registry";
import { toolCover, toolLogo } from "@/lib/assets";

// Artwork intentionally deferred by the maintainer (2026-10-18): these tools
// ship code-only for now. Remove a slug from this set when its cover/logo land.
const PENDING_ARTWORK = new Set([
  // batch 1
  "totp-generator",
  "jsonpath-tester",
  "programmer-calculator",
  "aes-crypto",
  "har-analyzer",
  // batch 2
  "json-to-types",
  "code-minifier",
  "curl-converter",
  "graphql-client",
  "websocket-tester",
]);

describe("tool artwork", () => {
  it.each(tools.map((tool) => tool.slug))("%s has a cover and a logo in public/", (slug) => {
    if (PENDING_ARTWORK.has(slug)) return;
    expect(existsSync(join(process.cwd(), "public", toolCover(slug)))).toBe(true);
    expect(existsSync(join(process.cwd(), "public", toolLogo(slug)))).toBe(true);
  });
});
