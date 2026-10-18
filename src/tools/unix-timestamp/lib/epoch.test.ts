import { describe, expect, it } from "vitest";
import { convertToDate, convertToEpoch, wallFromInputs, zonedToEpoch } from "@/tools/unix-timestamp/lib/epoch";

const NOW = Date.parse("2026-06-01T12:00:00Z");

describe("unix timestamp", () => {
  it("converts epoch seconds and milliseconds to UTC", () => {
    const seconds = convertToDate("1609459200", "UTC", "auto", NOW);
    const millis = convertToDate("1609459200000", "UTC", "auto", NOW);
    expect("error" in seconds).toBe(false);
    expect("error" in millis).toBe(false);
    if ("error" in seconds || "error" in millis) return;
    expect(seconds.unit).toBe("s");
    expect(millis.unit).toBe("ms");
    expect(seconds.isoUtc).toBe("2021-01-01T00:00:00.000Z");
    expect(millis.isoUtc).toBe(seconds.isoUtc);
    expect(seconds.rfc2822).toBe("Fri, 01 Jan 2021 00:00:00 +0000");
    expect(seconds.relative).toContain("ago");
  });

  it("formats the same instant in a fixed offset and a half-hour zone", () => {
    const kolkata = convertToDate("1609459200", "Asia/Kolkata", "s", NOW);
    const newYork = convertToDate("1609459200", "America/New_York", "s", NOW);
    expect("error" in kolkata || "error" in newYork).toBe(false);
    if ("error" in kolkata || "error" in newYork) return;
    expect(kolkata.isoLocal).toBe("2021-01-01T05:30:00+05:30");
    expect(newYork.isoLocal).toBe("2020-12-31T19:00:00-05:00");
  });

  it("converts a zoned wall time back to epoch seconds", () => {
    const wall = wallFromInputs("2021-01-01", "05:30:00");
    expect("error" in wall).toBe(false);
    if ("error" in wall) return;
    const result = convertToEpoch(wall, "Asia/Kolkata", NOW);
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.seconds).toBe("1609459200");
    expect(result.milliseconds).toBe("1609459200000");
  });

  it("reports a daylight-saving gap and both instants of an overlap", () => {
    const gap = zonedToEpoch({ year: 2026, month: 3, day: 8, hour: 2, minute: 30, second: 0, millisecond: 0 }, "America/New_York");
    const overlap = zonedToEpoch({ year: 2026, month: 11, day: 1, hour: 1, minute: 30, second: 0, millisecond: 0 }, "America/New_York");
    expect(gap).toEqual({ error: "That local time does not exist in this time zone because of a daylight-saving gap." });
    expect("error" in overlap).toBe(false);
    if ("error" in overlap) return;
    expect(new Date(overlap.ms).toISOString()).toBe("2026-11-01T05:30:00.000Z");
    expect(overlap.alternateMs === null ? "" : new Date(overlap.alternateMs).toISOString()).toBe("2026-11-01T06:30:00.000Z");
  });

  it("parses ISO-8601 with an offset and RFC 2822", () => {
    const iso = convertToDate("2021-01-01T05:30:00+05:30", "UTC", "auto", NOW);
    const rfc = convertToDate("Fri, 01 Jan 2021 00:00:00 +0000", "UTC", "auto", NOW);
    expect("error" in iso || "error" in rfc).toBe(false);
    if ("error" in iso || "error" in rfc) return;
    expect(iso.ms).toBe(1_609_459_200_000);
    expect(rfc.ms).toBe(1_609_459_200_000);
  });

  it("rejects a date that does not exist and an unknown zone", () => {
    expect(convertToDate("2026-02-31", "UTC")).toHaveProperty("error");
    expect(convertToDate("0", "Mars/Base")).toHaveProperty("error");
    expect(convertToDate("not a date", "UTC")).toHaveProperty("error");
  });
});
