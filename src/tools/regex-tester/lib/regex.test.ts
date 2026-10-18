import { describe, expect, it } from "vitest";
import { highlightSpans, testRegex } from "@/tools/regex-tester/lib/regex";

describe("regex tester", () => {
  it("returns every match and named groups", () => {
    const result = testRegex("(?<word>[A-Za-z]+) (\\d+)", "g", "Ada 12 Grace 7");
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.matches).toHaveLength(2);
    expect(result.matches[0]).toMatchObject({ index: 0, value: "Ada 12" });
    expect(result.matches[0]?.groups.find((group) => group.name === "word")?.value).toBe("Ada");
    expect(result.matches[0]?.groups.find((group) => group.name === "1")?.value).toBe("Ada");
    expect(result.explanation.some((line) => line.includes("Named group word"))).toBe(true);
  });

  it("previews a replacement and explains a quantifier", () => {
    const result = testRegex("a+", "i", "baAAc", "X");
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.matches.map((match) => match.value)).toEqual(["aAA"]);
    expect(result.replacement).toBe("bXc");
    expect(result.explanation[0]).toMatch(/One or more/);
  });

  it("advances past an empty match", () => {
    const result = testRegex("a*", "g", "b");
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.matches.length).toBeLessThan(10);
  });

  it("rejects a bad pattern, a repeated flag, and u with v", () => {
    expect(testRegex("(", "", "a").valid).toBe(false);
    expect(testRegex("a", "gg", "a").valid).toBe(false);
    expect(testRegex("a", "uv", "a").valid).toBe(false);
  });

  it("builds highlight spans", () => {
    const spans = highlightSpans("ababa", [
      { index: 1, length: 1, value: "b", groups: [] },
      { index: 3, length: 1, value: "b", groups: [] },
    ]);
    expect(spans.map((span) => `${span.match ? "*" : ""}${span.text}`).join("|")).toBe("a|*b|a|*b|a");
  });
});
