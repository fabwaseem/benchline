import { describe, expect, it } from "vitest";
import { calculatePercent } from "@/tools/percentage-calculator/lib/percent";

describe("percentage calculator", () => {
  it("computes each form with decimal rounding", () => {
    expect(calculatePercent("of", "10", "200")).toMatchObject({ result: "20", unit: "number" });
    expect(calculatePercent("is", "20", "200")).toMatchObject({ result: "10", unit: "percent" });
    expect(calculatePercent("change", "80", "100")).toMatchObject({ result: "25", formula: "(100 − 80) ÷ 80 × 100 = 25%" });
    expect(calculatePercent("change", "100", "80")).toMatchObject({ result: "-20" });
    expect(calculatePercent("reverse", "20", "10")).toMatchObject({ result: "200" });
    expect(calculatePercent("increase", "10", "50")).toMatchObject({ result: "55" });
    expect(calculatePercent("decrease", "10", "50")).toMatchObject({ result: "45" });
  });

  it("separates margin from markup", () => {
    const result = calculatePercent("margin", "60", "100");
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.result).toBe("40");
    expect(result.parts).toEqual([
      { label: "Profit", value: "40" },
      { label: "Markup", value: "66.66666667%" },
    ]);
    expect(result.formula).toContain("(100 − 60) ÷ 100 × 100");
  });

  it("keeps repeating decimals exact enough to round half up", () => {
    expect(calculatePercent("of", "10", "1")).toMatchObject({ result: "0.1" });
    expect(calculatePercent("is", "1", "3")).toMatchObject({ result: "33.33333333" });
  });

  it("rejects a zero divisor", () => {
    expect("error" in calculatePercent("change", "0", "10")).toBe(true);
    expect("error" in calculatePercent("is", "1", "0")).toBe(true);
    expect("error" in calculatePercent("margin", "10", "0")).toBe(true);
  });
});
