import { describe, expect, it } from "vitest";
import { fitTabs, visibleTabIndexes } from "@/components/kit/shell/fit-tabs";

describe("fitTabs", () => {
  it("shows every tab when they fit", () => {
    expect(fitTabs([40, 50, 60], 200, 72, 8)).toBe(3);
  });

  it("reserves room for More when they do not", () => {
    expect(fitTabs([80, 80, 80, 80], 200, 72, 8)).toBe(1);
  });

  it("returns zero when even one tab and More cannot fit", () => {
    expect(fitTabs([80, 80], 70, 72, 8)).toBe(0);
  });
});

describe("visibleTabIndexes", () => {
  it("keeps the selected overflow tab on the bar", () => {
    expect(visibleTabIndexes([40, 40, 40, 40], 160, 48, 8, 3)).toEqual([0, 3]);
  });

  it("returns every index when nothing overflows", () => {
    expect(visibleTabIndexes([20, 20], 200, 48, 8, 1)).toEqual([0, 1]);
  });
});
