import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/v1/tools/[slug]/route";
import { resetRateLimit } from "@/lib/net/rate-limit";
import { exampleJson, formatJson } from "@/tools/json-formatter/lib/format";
import { outputSchema, tool } from "@/tools/json-formatter/mcp";

const pretty = { indent: "2" as const, sortKeys: false, minify: false };

describe("formatJson", () => {
  it("pretty-prints, minifies, and sorts keys", () => {
    const formatted = formatJson('{"b":1,"a":{"d":true,"c":null}}', pretty);
    expect(formatted.valid).toBe(true);
    expect(formatted.output).toBe('{\n  "b": 1,\n  "a": {\n    "d": true,\n    "c": null\n  }\n}');
    expect(formatJson(formatted.output, { indent: "2", sortKeys: true, minify: true }).output).toBe('{"a":{"c":null,"d":true},"b":1}');
    expect(formatJson('{"a":1}', { indent: "tab", sortKeys: false, minify: false }).output).toBe('{\n\t"a": 1\n}');
    expect(formatJson('{"a":1}', { indent: "4", sortKeys: false, minify: false }).output).toBe('{\n    "a": 1\n}');
  });

  it("keeps unicode and array order", () => {
    const result = formatJson('{"café":"雪","list":[2,1]}', { indent: "2", sortKeys: true, minify: true });
    expect(result.output).toBe('{"caf\u00e9":"\u96ea","list":[2,1]}');
    expect(result.tree?.children.map((child) => child.key)).toEqual(["café", "list"]);
    expect(result.tree?.children[1]?.children.map((child) => child.preview)).toEqual(["2", "1"]);
  });

  it("reports the line and column of a trailing comma", () => {
    const result = formatJson('{\n  "a": 1,\n}\n', pretty);
    expect(result.valid).toBe(false);
    expect(result.output).toBe("");
    expect(result.errors[0]).toMatchObject({
      message: "Expected a property name",
      line: 3,
      column: 1,
      excerpt: "}",
    });
  });

  it("rejects comments, single quotes, and a leading zero", () => {
    expect(formatJson("// no\n{}", pretty).errors[0]).toMatchObject({
      message: "Comments are not valid JSON",
      line: 1,
      column: 1,
    });
    expect(formatJson("{'a':1}", pretty).errors[0]).toMatchObject({ line: 1, column: 2 });
    expect(formatJson("01", pretty).errors[0]).toMatchObject({ message: "Unexpected extra input", line: 1, column: 2 });
    expect(formatJson("", pretty).errors[0]).toMatchObject({ message: "Expected a value", line: 1, column: 1 });
    expect(formatJson('{"a": }', pretty).errors[0]).toMatchObject({ message: "Expected a value", line: 1, column: 7 });
  });

  it("formats the example", () => {
    const result = formatJson(exampleJson, pretty);
    expect(result.valid).toBe(true);
    expect(JSON.parse(result.output)).toMatchObject({ name: "Ada Lovelace", year: 1843 });
  });

  // The formatter page calls formatJson on the editor text, so this is the UI path.
  it("keeps digits that do not fit in a JavaScript number", () => {
    const input = '{"id":9007199254740993,"ratio":0.10000000000000000001,"n":1.0}';
    const formatted = formatJson(input, pretty);
    expect(formatted.valid).toBe(true);
    expect(formatted.output).toBe('{\n  "id": 9007199254740993,\n  "ratio": 0.10000000000000000001,\n  "n": 1\n}');
    expect(formatted.output).not.toContain("9007199254740992");
    expect(formatted.tree?.children.map((child) => child.preview)).toEqual(["9007199254740993", "0.10000000000000000001", "1"]);
    const minified = formatJson(input, { indent: "2", sortKeys: true, minify: true });
    expect(minified.output).toBe('{"id":9007199254740993,"n":1,"ratio":0.10000000000000000001}');
  });
});

const wide = '{"id":9007199254740993,"ratio":0.10000000000000000001}';

describe("format_json adapters", () => {
  it("keeps the digits through the MCP handler", async () => {
    const result = outputSchema.parse(await tool.run({ json: wide }));
    expect(result.valid).toBe(true);
    expect(result.output).toContain("9007199254740993");
    expect(result.output).toContain("0.10000000000000000001");
    expect(JSON.stringify(result)).not.toContain("9007199254740992");
  });

  it("keeps the digits through the HTTP route", async () => {
    resetRateLimit();
    const response = await POST(
      new Request("https://benchline.fabwaseem.com/api/v1/tools/json-formatter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ json: wide }),
      }),
      { params: Promise.resolve({ slug: "json-formatter" }) },
    );
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain("9007199254740993");
    expect(text).toContain("0.10000000000000000001");
    expect(text).not.toContain("9007199254740992");
  });
});
