import { describe, expect, it } from "vitest";
import { parsePageSelection } from "@/lib/page-range";

describe("parsePageSelection", () => {
  it("uses every page when the range is blank", () => {
    expect(parsePageSelection("", 3)).toEqual([1, 2, 3]);
    expect(parsePageSelection("  ", 2)).toEqual([1, 2]);
  });

  it("keeps written order and drops duplicates", () => {
    expect(parsePageSelection("1-3,5", 6)).toEqual([1, 2, 3, 5]);
    expect(parsePageSelection("5, 1-2, 2", 5)).toEqual([5, 1, 2]);
    expect(parsePageSelection("01", 3)).toEqual([1]);
  });

  it("rejects pages the document does not have", () => {
    expect(() => parsePageSelection("0", 3)).toThrow(/start at 1/);
    expect(() => parsePageSelection("4", 3)).toThrow(/3 pages/);
    expect(() => parsePageSelection("3-1", 3)).toThrow(/reversed/);
    expect(() => parsePageSelection("1-", 3)).toThrow(/not a page/);
    expect(() => parsePageSelection("1", 0)).toThrow(/no pages/);
  });
});
