import { access, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { assertToolContract } from "@/lib/mcp/contract";
import { tools } from "@/registry";
import { mcpTools } from "@/registry/mcp-registry";

const root = process.cwd();

describe("MCP coverage", () => {
  it("gives every registered tool a handler and a valid schema", async () => {
    const entries = await readdir(path.join(root, "src/tools"), { withFileTypes: true });
    const slugs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
    expect(slugs.length).toBeGreaterThan(0);
    expect(tools.map((tool) => tool.slug).sort()).toEqual(slugs);
    expect(mcpTools.map((tool) => tool.slug).sort()).toEqual(slugs);

    const names = new Set<string>();
    for (const slug of slugs) {
      await access(path.join(root, "src/tools", slug, "mcp.ts"));
      const tool = mcpTools.find((item) => item.slug === slug);
      expect(tool, slug).toBeTruthy();
      if (!tool) continue;
      expect(names.has(tool.name), tool.name).toBe(false);
      names.add(tool.name);
      expect(() => assertToolContract(tool)).not.toThrow();
    }
  });

  it("rejects a tool with an invalid name or schema", () => {
    const tool = mcpTools[0];
    expect(tool).toBeTruthy();
    if (!tool) return;
    expect(() => assertToolContract({ ...tool, name: "JSON" })).toThrow(/snake_case/);
    expect(() => assertToolContract({ ...tool, inputSchema: z.string() })).toThrow(/input schema/);
  });
});
