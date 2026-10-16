import { describe, expect, it } from "vitest";
import { ogColors, oklchToRgb } from "@/lib/og-color";

describe("oklchToRgb", () => {
  it("keeps paper near white and cobalt in the blue range", () => {
    expect(ogColors.paper.startsWith("rgb(")).toBe(true);
    expect(oklchToRgb(0.985, 0.004, 95)).toBe(ogColors.paper);
    const cobalt = ogColors.cobalt.match(/\d+/g)?.map(Number) ?? [];
    expect(cobalt[2]).toBeGreaterThan(cobalt[0] ?? 0);
    expect(cobalt[2]).toBeGreaterThan(cobalt[1] ?? 0);
  });
});
