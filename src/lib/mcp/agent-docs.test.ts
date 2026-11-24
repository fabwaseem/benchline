import { describe, expect, it } from "vitest";
import { errorHint, resolveApiSlug, serverInstructions, toolApiDoc, toolApiIndex, wellKnownMcp } from "@/lib/mcp/agent-docs";
import { mcpTools } from "@/registry/mcp-registry";

describe("toolApiDoc", () => {
  it("returns null for an unknown slug", () => {
    expect(toolApiDoc("no-such-tool")).toBeNull();
  });

  it("describes how to call a tool, with schemas and a working example", () => {
    const doc = toolApiDoc("json-formatter");
    expect(doc?.name).toBe("format_json");
    expect(doc?.run.method).toBe("POST");
    expect(doc?.run.url).toMatch(/\/api\/v1\/tools\/json-formatter$/);
    expect(doc?.inputSchema).toHaveProperty("properties");
    expect(doc?.outputSchema).toHaveProperty("properties");
    expect(doc?.example.curl).toContain("curl -s");
    expect(doc?.docs.markdown).toMatch(/\/t\/json-formatter\.md$/);
  });

  it("has an example body that passes its own input schema, for every tool", () => {
    for (const tool of mcpTools) {
      const doc = toolApiDoc(tool.slug);
      expect(tool.inputSchema.safeParse(doc?.example.body).success, tool.slug).toBe(true);
    }
  });
});

describe("toolApiIndex", () => {
  it("lists every tool with a URL to run it", () => {
    const index = toolApiIndex();
    expect(index.count).toBe(mcpTools.length);
    expect(index.tools).toHaveLength(mcpTools.length);
    expect(index.tools[0]?.url).toMatch(/\/api\/v1\/tools\//);
    expect(index.links.mcp).toMatch(/\/mcp$/);
  });
});

describe("serverInstructions", () => {
  it("tells the model how to pick tools, send files, and find docs", () => {
    const text = serverInstructions();
    expect(text).toContain(`${mcpTools.length} deterministic tools`);
    expect(text).toContain("base64");
    expect(text).toContain("/llms.txt");
  });
});

describe("errorHint", () => {
  it("points at the tool's schema and Markdown docs", () => {
    const hint = errorHint("pdf-merge");
    expect(hint).toContain("/api/v1/tools/pdf-merge");
    expect(hint).toContain("/t/pdf-merge.md");
  });
});

describe("wellKnownMcp", () => {
  it("names the endpoint, transport, and auth", () => {
    const card = wellKnownMcp();
    expect(card.endpoint).toMatch(/\/mcp$/);
    expect(card.transport).toBe("streamable-http");
    expect(card.authentication.required).toBe(false);
    expect(card.tools).toHaveLength(mcpTools.length);
  });
});

describe("resolveApiSlug", () => {
  it("accepts the URL slug or the MCP name", () => {
    expect(resolveApiSlug("jwt-decoder")).toBe("jwt-decoder");
    expect(resolveApiSlug("decode_jwt")).toBe("jwt-decoder");
    expect(resolveApiSlug(" Decode_JWT ")).toBe("jwt-decoder");
  });

  it("returns null for anything else", () => {
    expect(resolveApiSlug("nope")).toBeNull();
    expect(resolveApiSlug("")).toBeNull();
    expect(resolveApiSlug(undefined)).toBeNull();
  });
});
