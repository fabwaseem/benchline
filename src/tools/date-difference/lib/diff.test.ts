import { describe, expect, it } from "vitest";
import { difference } from "@/tools/date-difference/lib/diff";

describe("date difference", () => {
  it("counts calendar days, weeks, and the elapsed time", () => {
    const result = difference({ startDate: "2026-01-01", endDate: "2026-01-31", startTime: "00:00", endTime: "00:00" });
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.totalDays).toBe(30);
    expect(result.countedDays).toBe(30);
    expect(result.weeks).toBe(4);
    expect(result.extraDays).toBe(2);
    expect(result.sign).toBe(1);
    expect(result.months).toBe(0);
    expect(result.days).toBe(30);
  });

  it("includes the end date and skips weekends and weekday holidays", () => {
    const result = difference({
      startDate: "2026-01-01",
      endDate: "2026-01-07",
      includeEnd: true,
      holidays: "2026-01-01\n# comment\n2026-01-05",
    });
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.countedDays).toBe(7);
    expect(result.weekendDays).toBe(2);
    expect(result.holidayDays).toBe(2);
    expect(result.businessDays).toBe(3);
  });

  it("borrows a short month when the start day does not exist in the next month", () => {
    const result = difference({ startDate: "2026-01-31", endDate: "2026-03-01" });
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.years).toBe(0);
    expect(result.months).toBe(1);
    expect(result.days).toBe(1);
  });

  it("keeps the sign when the end is earlier and rejects a bad holiday", () => {
    const reversed = difference({ startDate: "2026-02-10", endDate: "2026-02-01", startTime: "12:00:00", endTime: "00:00:00" });
    expect("error" in reversed).toBe(false);
    if ("error" in reversed) return;
    expect(reversed.sign).toBe(-1);
    expect(reversed.totalDays).toBe(9);
    expect(difference({ startDate: "2026-01-01", endDate: "2026-01-02", holidays: "01/01" })).toEqual({
      error: "01/01 is not a holiday date. Use YYYY-MM-DD.",
    });
    expect(difference({ startDate: "2026-02-31", endDate: "2026-03-01" })).toHaveProperty("error");
  });
});
