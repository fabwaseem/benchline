import { describe, expect, it } from "vitest";
import { evaluateJsonPath, formatValue } from "@/tools/jsonpath-tester/lib/jsonpath";

const STORE = JSON.stringify({
  store: {
    book: [
      { category: "reference", author: "Nigel Rees", title: "Sayings of the Century", price: 8.95 },
      { category: "fiction", author: "Evelyn Waugh", title: "Sword of Honour", price: 12.99 },
      { category: "fiction", author: "Herman Melville", title: "Moby Dick", price: 8.99 },
      { category: "fiction", author: "J. R. R. Tolkien", title: "The Lord of the Rings", price: 22.99 },
    ],
    bicycle: { color: "red", price: 19.95 },
  },
});

describe("JSONPath tester", () => {
  it("evaluates member access and wildcards", () => {
    const result = evaluateJsonPath(STORE, "$.store.book[*].author");
    expect(result).toMatchObject({ count: 4, truncated: false });
    if ("error" in result) return;
    expect(result.matches.map((match) => match.value)).toEqual([
      "Nigel Rees",
      "Evelyn Waugh",
      "Herman Melville",
      "J. R. R. Tolkien",
    ]);
    expect(result.matches[0]?.path).toContain("book");
  });

  it("evaluates recursive descent and filters", () => {
    const prices = evaluateJsonPath(STORE, "$..price");
    expect(prices).toMatchObject({ count: 5 });
    const cheap = evaluateJsonPath(STORE, "$.store.book[?(@.price < 10)].title");
    if ("error" in cheap) throw new Error("expected matches");
    expect(cheap.matches.map((match) => match.value)).toEqual(["Sayings of the Century", "Moby Dick"]);
  });

  it("evaluates slices and unions", () => {
    const slice = evaluateJsonPath(STORE, "$.store.book[0:2].title");
    expect(slice).toMatchObject({ count: 2 });
    const union = evaluateJsonPath(STORE, "$.store['bicycle','book']");
    expect(union).toMatchObject({ count: 2 });
  });

  it("truncates large result sets", () => {
    const big = JSON.stringify({ items: Array.from({ length: 10 }, (_, index) => index) });
    const result = evaluateJsonPath(big, "$.items[*]", 3);
    expect(result).toMatchObject({ count: 10, truncated: true });
    if ("error" in result) return;
    expect(result.matches).toHaveLength(3);
  });

  it("reports syntax errors", () => {
    expect(evaluateJsonPath(STORE, "")).toMatchObject({ error: "The query is empty." });
    expect(evaluateJsonPath(STORE, ".store")).toMatchObject({ error: expect.stringContaining("must start with $") });
    expect(evaluateJsonPath(STORE, "$.store.book[0")).toMatchObject({ error: expect.stringContaining("Unclosed [") });
    expect(evaluateJsonPath(STORE, "$.store.book]")).toMatchObject({ error: expect.stringContaining("Unmatched ]") });
    expect(evaluateJsonPath(STORE, "$.store['a")).toMatchObject({ error: expect.stringContaining("unterminated string") });
    expect(evaluateJsonPath(STORE, "$.a(b]")).toMatchObject({ error: expect.stringContaining("Unmatched ]") });
  });

  it("reports invalid JSON", () => {
    const result = evaluateJsonPath("{oops", "$.a");
    expect(result).toMatchObject({ error: expect.stringContaining("JSON is invalid") });
  });

  it("keeps digits that do not fit in a JavaScript number", () => {
    const doc = '{"id":9007199254740993,"ratio":0.10000000000000000001,"ok":1}';
    const result = evaluateJsonPath(doc, "$.id");
    expect(result).toMatchObject({ warning: expect.stringContaining("9007199254740993") });
    if ("error" in result) return;
    expect(result.matches[0]?.value).toBe("9007199254740993");
    expect(formatValue(result.matches[0]?.value)).toBe("9007199254740993");
    const root = evaluateJsonPath(doc, "$");
    if ("error" in root) throw new Error(root.error);
    expect(root.matches[0]?.value).toEqual({ id: "9007199254740993", ratio: "0.10000000000000000001", ok: 1 });
    expect(formatValue(root.matches[0]?.value)).toContain("0.10000000000000000001");
  });

  it("formats values for display", () => {
    expect(formatValue("hi")).toBe("hi");
    expect(formatValue({ a: 1 })).toBe('{"a":1}');
    expect(formatValue(42)).toBe("42");
  });
});
