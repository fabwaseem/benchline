import { describe, expect, it } from "vitest";
import { exampleArguments, mcpServerConfig, toolsCallParams } from "@/lib/mcp/example";
import { mcpTools } from "@/registry/mcp-registry";
import { SITE_URL } from "@/lib/site";

describe("mcp examples", () => {
  it("builds a streamable HTTP config for the public endpoint", () => {
    expect(mcpServerConfig(`${SITE_URL}/mcp`)).toEqual({
      mcpServers: { benchline: { url: `${SITE_URL}/mcp` } },
    });
    expect(SITE_URL).toMatch(/^https:\/\//);
  });

  it("builds arguments that each tool input schema accepts", () => {
    expect(mcpTools.length).toBeGreaterThan(0);
    for (const tool of mcpTools) {
      const args = exampleArguments(tool.inputSchema);
      expect(tool.inputSchema.safeParse(args).success, tool.name).toBe(true);
      const call = toolsCallParams(tool.name, args);
      expect(call.name).toBe(tool.name);
      expect(call.arguments).toEqual(args);
    }
  });
});
