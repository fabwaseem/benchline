import { describe, expect, it } from "vitest";
import {
  convertAmount,
  formatMoney,
  historicalUrl,
  isCurrencyCode,
  isoDateDaysAgo,
  latestUrl,
  parseAmountInput,
  parseLatest,
  parseTimeSeries,
  timeSeriesUrl,
  trendStats,
} from "./currency";

describe("currency urls", () => {
  it("builds a latest url", () => {
    expect(latestUrl("usd", ["eur", "gbp"])).toBe(
      "https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR%2CGBP",
    );
  });

  it("builds a historical url", () => {
    expect(historicalUrl("2024-01-15", "USD", ["EUR"])).toBe(
      "https://api.frankfurter.dev/v1/2024-01-15?base=USD&symbols=EUR",
    );
  });

  it("builds a time series url", () => {
    expect(timeSeriesUrl("2024-01-01", "2024-02-01", "USD", "EUR")).toBe(
      "https://api.frankfurter.dev/v1/2024-01-01..2024-02-01?base=USD&symbols=EUR",
    );
  });
});

describe("parseLatest", () => {
  it("parses a frankfurter latest response", () => {
    const parsed = parseLatest({ amount: 1, base: "usd", date: "2024-03-01", rates: { eur: 0.92, gbp: 0.79 } });
    expect(parsed).toEqual({ base: "USD", date: "2024-03-01", rates: { EUR: 0.92, GBP: 0.79 } });
  });

  it("rejects malformed responses", () => {
    expect(() => parseLatest(null)).toThrow();
    expect(() => parseLatest({ base: "USD" })).toThrow();
    expect(() => parseLatest({ base: "USD", date: "2024-03-01", rates: { EUR: "nope" } })).toThrow();
    expect(() => parseLatest({ base: "USD", date: "2024-03-01", rates: { EUR: -1 } })).toThrow();
  });
});

describe("parseTimeSeries", () => {
  it("parses and sorts points", () => {
    const parsed = parseTimeSeries(
      {
        rates: {
          "2024-02-01": { EUR: 0.93 },
          "2024-01-01": { EUR: 0.91 },
          "2024-01-15": { EUR: "bad" },
        },
      },
      "eur",
    );
    expect(parsed).toEqual([
      { date: "2024-01-01", rate: 0.91 },
      { date: "2024-02-01", rate: 0.93 },
    ]);
  });

  it("rejects malformed responses", () => {
    expect(() => parseTimeSeries(null, "EUR")).toThrow();
    expect(() => parseTimeSeries({ rates: [] }, "EUR")).toThrow();
  });
});

describe("math and formatting", () => {
  it("converts amounts", () => {
    expect(convertAmount(100, 0.92)).toBeCloseTo(92, 10);
    expect(convertAmount(0, 1.5)).toBe(0);
  });

  it("formats money", () => {
    expect(formatMoney(1234.5, "USD")).toBe("$1,234.50");
    expect(formatMoney(99.9, "EUR")).toContain("99.90");
  });

  it("parses amount input", () => {
    expect(parseAmountInput("1,234.50")).toEqual({ ok: true, value: 1234.5 });
    expect(parseAmountInput("  42 ")).toEqual({ ok: true, value: 42 });
    expect(parseAmountInput("")).toEqual({ ok: false, error: "Enter an amount." });
    expect(parseAmountInput("abc")).toEqual({ ok: false, error: "That is not a number." });
    expect(parseAmountInput("-5")).toEqual({ ok: false, error: "The amount cannot be negative." });
  });

  it("validates currency codes", () => {
    expect(isCurrencyCode("usd")).toBe(true);
    expect(isCurrencyCode("CZK")).toBe(true);
    expect(isCurrencyCode("PKR")).toBe(false);
    expect(isCurrencyCode("XXX")).toBe(false);
  });

  it("computes trend stats", () => {
    const stats = trendStats([
      { date: "2024-01-01", rate: 1 },
      { date: "2024-01-02", rate: 1.1 },
      { date: "2024-01-03", rate: 0.9 },
    ]);
    expect(stats?.min).toBe(0.9);
    expect(stats?.max).toBe(1.1);
    expect(stats?.first).toBe(1);
    expect(stats?.last).toBe(0.9);
    expect(stats?.changePct).toBeCloseTo(-10, 10);
    expect(trendStats([])).toBeNull();
  });

  it("computes iso dates", () => {
    expect(isoDateDaysAgo(0, new Date("2024-05-10T12:00:00Z"))).toBe("2024-05-10");
    expect(isoDateDaysAgo(30, new Date("2024-05-10T12:00:00Z"))).toBe("2024-04-10");
  });
});
