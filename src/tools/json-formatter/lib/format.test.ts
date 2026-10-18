import { describe, expect, it } from "vitest";
import { exampleJson, formatJson } from "@/tools/json-formatter/lib/format";

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
});
