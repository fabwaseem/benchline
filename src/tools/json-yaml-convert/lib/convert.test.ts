import { describe, expect, it } from "vitest";
import { convertData, detectFormat, exampleYaml } from "@/tools/json-yaml-convert/lib/convert";

describe("detectFormat", () => {
  it("recognises each format from the first line", () => {
    expect(detectFormat('{"a":1}')).toBe("json");
    expect(detectFormat(exampleYaml)).toBe("yaml");
    expect(detectFormat('name = "Ada"\n')).toBe("toml");
    expect(detectFormat("<note>Hi</note>")).toBe("xml");
    expect(detectFormat("   ")).toBeNull();
  });
});

describe("convertData", () => {
  it("round-trips JSON, YAML, and TOML", () => {
    const yaml = convertData('{"name":"Ada","year":1843}', "json", "yaml");
    expect(yaml.ok).toBe(true);
    expect(yaml.output).toContain("name: Ada");
    const back = convertData(yaml.output, "yaml", "json");
    expect(JSON.parse(back.output)).toEqual({ name: "Ada", year: 1843 });

    const toml = convertData('{"name":"Ada","nested":{"ok":true},"list":[1,2]}', "json", "toml");
    expect(toml.ok).toBe(true);
    expect(toml.output).toContain('name = "Ada"');
    expect(JSON.parse(convertData(toml.output, "auto", "json").output)).toEqual({
      name: "Ada",
      nested: { ok: true },
      list: [1, 2],
    });
  });

  it("converts XML and keeps attributes", () => {
    const json = convertData('<note id="1"><to>Ada</to></note>', "xml", "json");
    expect(json.ok).toBe(true);
    expect(JSON.parse(json.output)).toEqual({ note: { to: "Ada", "@id": "1" } });
    const xml = convertData(json.output, "json", "xml");
    expect(xml.output).toContain('id="1"');
    expect(xml.output).toContain("<to>Ada</to>");
    expect(convertData('{"items":[1,2]}', "json", "xml").output).toContain("<root>");
  });

  it("escapes XML text", () => {
    const xml = convertData('{"note":"a < b & c"}', "json", "xml");
    expect(xml.output).toContain("a &lt; b &amp; c");
  });

  it("reports source errors with line and column", () => {
    expect(convertData('{\n  "a": 1,\n}\n', "json", "yaml")).toMatchObject({
      ok: false,
      line: 3,
      column: 1,
    });
    const yaml = convertData("a: :\n", "yaml", "json");
    expect(yaml.ok).toBe(false);
    expect(yaml.line).toBe(1);
    expect(yaml.column).toBe(4);
    const toml = convertData("a = \n", "toml", "json");
    expect(toml.ok).toBe(false);
    expect(toml.line).toBe(1);
    expect(toml.column).toBe(5);
    const xml = convertData("<root><a></root>", "xml", "json");
    expect(xml.ok).toBe(false);
    expect(xml.line).toBe(1);
    expect(xml.column).toBe(10);
  });

  it("refuses a lossy TOML document", () => {
    expect(convertData('{"a":null}', "json", "toml").error).toMatch(/null/);
    expect(convertData("[1, 2]", "json", "toml").error).toMatch(/top-level table/);
  });

  it("keeps YAML yes as a string under the JSON schema", () => {
    const result = convertData("yes: yes\n", "auto", "json");
    expect(JSON.parse(result.output)).toEqual({ yes: "yes" });
  });

  it("keeps digits that do not fit in a JavaScript number", () => {
    const source = '{"id":9007199254740993,"ratio":0.10000000000000000001}';
    const json = convertData(source, "json", "json");
    expect(json.output).toContain("9007199254740993");
    expect(json.output).toContain("0.10000000000000000001");
    const yaml = convertData(source, "json", "yaml");
    expect(yaml.output).toContain("9007199254740993");
    expect(yaml.output).toContain("0.10000000000000000001");
    expect(yaml.output).not.toContain("!!");
    const yamlBack = convertData(yaml.output, "yaml", "json");
    expect(yamlBack.output).toContain("9007199254740993");
    expect(yamlBack.output).toContain("0.10000000000000000001");
    const toml = convertData(source, "json", "toml");
    expect(toml.output).toContain("9007199254740993");
    expect(toml.output).toContain("0.10000000000000000001");
    expect(toml.output).not.toContain('"9007199254740993"');
    const tomlBack = convertData(toml.output, "toml", "json");
    expect(tomlBack.output).toContain("9007199254740993");
    expect(tomlBack.output).toContain("0.10000000000000000001");
    const xml = convertData("<root><id>9007199254740993</id><ratio>0.10000000000000000001</ratio></root>", "xml", "json");
    expect(xml.output).toContain("9007199254740993");
    expect(xml.output).toContain("0.10000000000000000001");
    expect(xml.output).not.toContain("9007199254740992");
    const xmlBack = convertData(xml.output, "json", "xml");
    expect(xmlBack.output).toContain(">9007199254740993<");
    expect(xmlBack.output).toContain(">0.10000000000000000001<");
  });

  it("converts the example", () => {
    const result = convertData(exampleYaml, "auto", "json");
    expect(result.detected).toBe("yaml");
    expect(JSON.parse(result.output)).toEqual({ name: "Ada Lovelace", year: 1843, tools: ["json", "yaml"] });
  });
});
