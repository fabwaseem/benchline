import { describe, expect, it } from "vitest";
import { directoryCatalog } from "@/lib/catalog";
import { mcpTools } from "@/registry/mcp-registry";

const batch4 = ["currency-converter", "meme-generator", "zip-tools", "photo-collage", "pdf-form-filler"] as const;

describe("directory and MCP slugs", () => {
  it("lists the same slugs", () => {
    const directory = directoryCatalog().tools.map((tool) => tool.slug).sort();
    const mcp = mcpTools.map((tool) => tool.slug).sort();
    expect(directory).toEqual(mcp);
    for (const slug of batch4) expect(directory).toContain(slug);
  });
});
