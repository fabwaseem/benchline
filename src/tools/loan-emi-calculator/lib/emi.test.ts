import { describe, expect, it } from "vitest";
import { calculateEmi } from "@/tools/loan-emi-calculator/lib/emi";

describe("EMI calculator", () => {
  it("matches the standard installment for 100000 at 10% over 12 months", () => {
    const result = calculateEmi("100000", "10", 12, "0");
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.emi).toBe("8791.59");
    expect(result.payoffMonths).toBe(12);
    expect(result.schedule[0]?.interest).toBe("833.33");
    expect(result.schedule[11]?.balance).toBe("0.00");
    expect(result.totalPrincipal).toBe("100000.00");
    const interest = Number(result.totalInterest);
    expect(interest).toBeGreaterThan(5400);
    expect(interest).toBeLessThan(5600);
  });

  it("charges no interest at a zero rate and splits the principal evenly", () => {
    const result = calculateEmi("1000", "0", 4, "0");
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.emi).toBe("250.00");
    expect(result.totalInterest).toBe("0.00");
    expect(result.schedule.every((row) => row.interest === "0.00")).toBe(true);
  });

  it("shortens the term when an extra payment is applied", () => {
    const plain = calculateEmi("10000", "12", 24, "0");
    const extra = calculateEmi("10000", "12", 24, "200");
    expect("error" in plain || "error" in extra).toBe(false);
    if ("error" in plain || "error" in extra) return;
    expect(extra.payoffMonths).toBeLessThan(plain.payoffMonths);
    expect(Number(extra.totalInterest)).toBeLessThan(Number(plain.totalInterest));
    expect(extra.csv.split("\n")[0]).toBe("month,payment,principal,interest,extra,balance");
    expect(extra.schedule.at(-1)?.balance).toBe("0.00");
  });

  it("rejects a zero principal and a term past 50 years", () => {
    expect(calculateEmi("0", "5", 12, "0")).toEqual({ error: "Principal must be greater than zero." });
    expect("error" in calculateEmi("1000", "5", 601, "0")).toBe(true);
  });
});
