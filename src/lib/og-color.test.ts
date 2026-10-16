import { describe, expect, it } from "vitest";
import { OG_INK, OG_PAPER, oklchToRgb } from "@/lib/og-color";

describe("oklchToRgb", () => {
  it("keeps paper near white and ink dark", () => {
    const paper = oklchToRgb(OG_PAPER.l, OG_PAPER.c, OG_PAPER.h);
    const ink = oklchToRgb(OG_INK.l, OG_INK.c, OG_INK.h);
    expect(paper.r).toBeGreaterThan(240);
    expect(paper.g).toBeGreaterThan(240);
    expect(paper.b).toBeGreaterThan(240);
    expect(ink.r).toBeLessThan(80);
    expect(ink.g).toBeLessThan(80);
    expect(ink.b).toBeLessThan(90);
  });
});
