import { describe, expect, it } from "vitest";
import { compareText, exampleLeft, exampleRight, sidePieces } from "@/tools/diff-checker/lib/diff";

describe("compareText", () => {
  it("builds a side-by-side line diff and a unified patch", () => {
    const result = compareText(exampleLeft, exampleRight, "line", false);
    expect(result.ok).toBe(true);
    expect(result.unchanged).toBe(false);
    expect(result.added).toBe(2);
    expect(result.removed).toBe(1);
    expect(result.rows.some((row) => row.kind === "change" && row.right.includes("Lovelace"))).toBe(true);
    expect(result.rows.some((row) => row.kind === "add" && row.right.includes("math"))).toBe(true);
    expect(result.patch).toContain("--- original");
    expect(result.patch).toContain("+const field");
  });

  it("ignores whitespace on lines and words", () => {
    expect(compareText("a\nb\n", "a \nb\n", "line", true).unchanged).toBe(true);
    expect(compareText("a\nb\n", "a \nb\n", "line", false).unchanged).toBe(false);
    expect(compareText("hello world", "hello  world", "word", true).unchanged).toBe(true);
    expect(compareText("hello world", "hello  world", "word", false).unchanged).toBe(false);
  });

  it("diffs characters and can drop whitespace", () => {
    const result = compareText("cat", "car", "char", false);
    expect(result.removed).toBe(1);
    expect(result.added).toBe(1);
    expect(sidePieces(result.pieces, "left").map((piece) => piece.value).join("")).toBe("cat");
    expect(sidePieces(result.pieces, "right").map((piece) => piece.value).join("")).toBe("car");
    expect(compareText("a b", "ab", "char", true).unchanged).toBe(true);
  });

  it("treats reordered JSON keys as the same document", () => {
    const result = compareText('{"b":1,"a":[2,{"z":true,"y":false}]}', '{"a":[2,{"y":false,"z":true}],"b":1}', "json", false);
    expect(result.ok).toBe(true);
    expect(result.unchanged).toBe(true);
  });

  it("shows a JSON value change and a parse error with line and column", () => {
    const result = compareText('{"a":1}', '{"a":2}', "json", false);
    expect(result.unchanged).toBe(false);
    expect(result.rows.some((row) => row.left.includes("1") && row.right.includes("2"))).toBe(true);
    const broken = compareText('{\n  "a": 1,\n}\n', "{}", "json", false);
    expect(broken.ok).toBe(false);
    expect(broken.error).toMatch(/Left side is not valid JSON/);
    expect(broken.error).toMatch(/line 3, column 1/);
  });

  it("reports identical text as unchanged", () => {
    const result = compareText("same\n", "same\n", "line", false);
    expect(result.unchanged).toBe(true);
    expect(result.rows).toEqual([{ kind: "same", left: "same", right: "same", leftNumber: 1, rightNumber: 1 }]);
  });
});
