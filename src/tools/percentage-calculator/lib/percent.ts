import Decimal from "decimal.js";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export const percentModes = ["of", "is", "change", "reverse", "increase", "decrease", "margin"] as const;
export type PercentMode = (typeof percentModes)[number];

export const percentLabels: Record<PercentMode, { label: string; a: string; b: string }> = {
  of: { label: "X% of Y", a: "Percent", b: "Value" },
  is: { label: "X is what % of Y", a: "Value", b: "Whole" },
  change: { label: "Percent change", a: "From", b: "To" },
  reverse: { label: "X is Y% of what", a: "Value", b: "Percent" },
  increase: { label: "Increase by", a: "Percent", b: "Value" },
  decrease: { label: "Decrease by", a: "Percent", b: "Value" },
  margin: { label: "Margin and markup", a: "Cost", b: "Price" },
};

export type PercentPart = { label: string; value: string };

export type PercentResult = {
  result: string;
  unit: "number" | "percent";
  formula: string;
  parts: PercentPart[];
};

export function calculatePercent(mode: PercentMode, aText: string, bText: string): PercentResult | { error: string } {
  const a = amount(aText, percentLabels[mode].a);
  if (typeof a === "string") return { error: a };
  const b = amount(bText, percentLabels[mode].b);
  if (typeof b === "string") return { error: b };
  const left = show(a);
  const right = show(b);
  switch (mode) {
    case "of":
      return numberResult(a.div(100).mul(b), `${left}% × ${right}`);
    case "is":
      if (b.isZero()) return { error: "The whole must not be zero." };
      return percentResult(a.div(b).mul(100), `${left} ÷ ${right} × 100`);
    case "change":
      if (a.isZero()) return { error: "The starting value must not be zero." };
      return percentResult(b.minus(a).div(a).mul(100), `(${right} − ${left}) ÷ ${left} × 100`);
    case "reverse":
      if (b.isZero()) return { error: "The percent must not be zero." };
      return numberResult(a.mul(100).div(b), `${left} ÷ ${right}%`);
    case "increase":
      return numberResult(b.mul(a.div(100).plus(1)), `${right} × (1 + ${left}%)`);
    case "decrease":
      return numberResult(b.mul(new Decimal(1).minus(a.div(100))), `${right} × (1 − ${left}%)`);
    case "margin": {
      if (b.isZero()) return { error: "Price must not be zero." };
      const profit = b.minus(a);
      const margin = profit.div(b).mul(100);
      const parts: PercentPart[] = [{ label: "Profit", value: show(profit) }];
      if (a.isZero()) parts.push({ label: "Markup", value: "undefined" });
      else parts.push({ label: "Markup", value: `${show(profit.div(a).mul(100))}%` });
      return {
        result: show(margin),
        unit: "percent",
        formula: `(${right} − ${left}) ÷ ${right} × 100`,
        parts,
      };
    }
    default:
      return { error: "Unknown percentage mode." };
  }
}

function numberResult(value: Decimal, formula: string): PercentResult {
  return { result: show(value), unit: "number", formula: `${formula} = ${show(value)}`, parts: [] };
}

function percentResult(value: Decimal, formula: string): PercentResult {
  return { result: show(value), unit: "percent", formula: `${formula} = ${show(value)}%`, parts: [] };
}

function amount(value: string, label: string): Decimal | string {
  const text = value.trim();
  if (!/^-?\d+(\.\d+)?$/.test(text)) return `${label} must be a number.`;
  return new Decimal(text);
}

function show(value: Decimal) {
  const fixed = value.toDecimalPlaces(8, Decimal.ROUND_HALF_UP).toFixed(8);
  return fixed.replace(/\.?0+$/, "") || "0";
}
