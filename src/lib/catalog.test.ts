import { describe, expect, it } from "vitest";
import { directoryCatalog } from "@/lib/catalog";
import { mcpTools } from "@/registry/mcp-registry";

describe("directory and MCP slugs", () => {
  it("lists the same slugs", () => {
    const directory = directoryCatalog().tools.map((tool) => tool.slug).sort();
    const mcp = mcpTools.map((tool) => tool.slug).sort();
    expect(directory).toEqual(mcp);
  });
});
