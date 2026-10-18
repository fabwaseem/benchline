import { describe, expect, it } from "vitest";
import { csvToJson, detectDelimiter, exampleCsv, inferCell, jsonToCsv } from "@/tools/csv-json-convert/lib/convert";

describe("csvToJson", () => {
  it("reads headers, quoted commas, and inferred types", () => {
    const result = csvToJson(exampleCsv, { delimiter: "auto", header: true, inferTypes: true });
    expect(result.ok).toBe(true);
    expect(result.delimiter).toBe(",");
    expect(result.rows).toBe(2);
    expect(JSON.parse(result.output)).toEqual([
      { name: "Ada", year: 1843, local: true },
      { name: "Lovelace, Ada", year: 1815, local: false },
    ]);
  });

  it("keeps strings when inference is off and drops the header when asked", () => {
    const strings = csvToJson("name,zip\nAda,02139\n", { delimiter: ",", header: true, inferTypes: true });
    expect(JSON.parse(strings.output)).toEqual([{ name: "Ada", zip: "02139" }]);
    const raw = csvToJson("Ada,true\n", { delimiter: ",", header: false, inferTypes: false });
    expect(JSON.parse(raw.output)).toEqual([["Ada", "true"]]);
  });

  it("detects semicolon and tab delimiters", () => {
    expect(detectDelimiter("a;b;c\n1;2;3\n")).toBe(";");
    expect(detectDelimiter("a\tb\n1\t2\n")).toBe("\t");
    const result = csvToJson("name;year\nAda;1843\n", { delimiter: "auto", header: true, inferTypes: true });
    expect(result.delimiter).toBe(";");
    expect(JSON.parse(result.output)).toEqual([{ name: "Ada", year: 1843 }]);
  });

  it("keeps digits that do not fit in a JavaScript number", () => {
    const result = csvToJson("id,ratio\n9007199254740993,0.10000000000000000001\n", { delimiter: ",", header: true, inferTypes: true });
    expect(result.ok).toBe(true);
    expect(result.output).toContain("9007199254740993");
    expect(result.output).toContain("0.10000000000000000001");
    expect(result.output).not.toContain("9007199254740992");
    const csv = jsonToCsv(result.output, { delimiter: ",", header: true, flatten: false });
    expect(csv.output).toContain("9007199254740993");
    expect(csv.output).toContain("0.10000000000000000001");
  });

  it("reports an unclosed quote", () => {
    const result = csvToJson('"Ada,1843\n', { delimiter: ",", header: false, inferTypes: false });
    expect(result.ok).toBe(false);
    expect(result.error.length).toBeGreaterThan(0);
  });
});

describe("jsonToCsv", () => {
  it("writes objects and arrays in both header modes", () => {
    const withHeader = jsonToCsv('[{"name":"Ada","year":1843}]', { delimiter: ",", header: true, flatten: false });
    expect(withHeader.output).toBe("name,year\nAda,1843");
    const without = jsonToCsv('[["Ada",1843]]', { delimiter: ";", header: false, flatten: false });
    expect(without.output).toBe("Ada;1843");
    expect(without.delimiter).toBe(";");
  });

  it("flattens nested objects and stringifies them otherwise", () => {
    const flat = jsonToCsv('[{"name":"Ada","address":{"city":"London"}}]', { delimiter: ",", header: true, flatten: true });
    expect(flat.output).toBe("name,address.city\nAda,London");
    const nested = jsonToCsv('[{"name":"Ada","address":{"city":"London"}}]', { delimiter: ",", header: true, flatten: false });
    expect(nested.output).toContain('"{""city"":""London""}"');
  });

  it("rejects a bare string and invalid JSON", () => {
    expect(jsonToCsv('"hello"', { delimiter: ",", header: true, flatten: false }).ok).toBe(false);
    expect(jsonToCsv("{", { delimiter: ",", header: true, flatten: false }).ok).toBe(false);
  });
});

describe("inferCell", () => {
  it("infers booleans, null, and numbers, and keeps leading zeros", () => {
    expect(inferCell("TRUE")).toBe(true);
    expect(inferCell("false")).toBe(false);
    expect(inferCell("NULL")).toBeNull();
    expect(inferCell("1.5")).toBe(1.5);
    expect(inferCell("1e2")).toBe(100);
    expect(inferCell("02139")).toBe("02139");
    expect(inferCell("Ada")).toBe("Ada");
  });
});
