import { describe, expect, it } from "vitest";
import { benchLlms, toolMarkdown } from "@/lib/mcp/llms-doc";
import { tools } from "@/registry";

describe("toolMarkdown", () => {
  it("returns null for an unknown slug", () => {
    expect(toolMarkdown("no-such-tool")).toBeNull();
  });

  it("describes a tool, how to use it, and how an agent calls it", () => {
    const md = toolMarkdown("jwt-decoder");
    expect(md).not.toBeNull();
    expect(md).toMatch(/^# JWT decoder\n/);
    expect(md).toContain("## How to use it");
    expect(md).toContain("MCP tool name: `decode_jwt`");
    expect(md).toContain("### Input schema");
    expect(md).toContain('"method": "tools/call"');
    expect(md).toContain("## Questions");
    expect(md).toContain("Built by: Waseem Anjum");
  });

  it("renders every registered tool", () => {
    for (const tool of tools) {
      const md = toolMarkdown(tool.slug);
      expect(md, tool.slug).toContain(`# ${tool.name}`);
    }
  });
});

describe("benchLlms", () => {
  it("names the founder and links each tool's Markdown copy", () => {
    const text = benchLlms();
    expect(text).toContain("Founder: Waseem Anjum");
    expect(text).toContain("/t/jwt-decoder.md");
  });
});
