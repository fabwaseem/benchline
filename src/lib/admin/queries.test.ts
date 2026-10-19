import { describe, expect, it } from "vitest";
import {
  durationMode,
  resolveRange,
  scopeFrom,
} from "@/lib/admin/range";
import {
  errorsQuery,
  liveQuery,
  runsSeriesQuery,
  toolUsageQuery,
} from "@/lib/admin/queries";
import { fillBuckets, mergeToolRows, percentDelta, stackRuns, zeroResultFlags, type UsageRow } from "@/lib/admin/shape";
import { isAdminPath } from "@/lib/analytics/text";

const now = new Date("2026-06-15T12:00:00.000Z");

function scope(range: "24h" | "30d", slug: string | null = null) {
  return scopeFrom(resolveRange({ range }, now), { slug });
}

describe("admin query builders", () => {
  it("uses raw rows for a recent hourly window and the daily rollup for a long window", () => {
    const recent = runsSeriesQuery(scope("24h"));
    expect(recent.text).toContain("from tool_runs");
    expect(recent.text).not.toContain("analytics_daily");
    expect(recent.text).toContain("date_trunc('hour'");
    const month = runsSeriesQuery(scope("30d"));
    expect(month.text).toContain("from tool_runs");
    expect(month.text).toContain("analytics_daily");
    expect(month.text).toContain("not exists (select 1 from tool_runs r where r.day = d.day)");
    expect(month.text).toContain("date_trunc('day'");
  });

  it("binds the slug instead of interpolating it", () => {
    const query = toolUsageQuery(scope("30d", "json-formatter"));
    expect(query.text).not.toContain("json-formatter");
    expect(query.values).toContain("json-formatter");
    expect(query.text).toContain("analytics_daily");
    const errors = errorsQuery(scope("30d", "json-formatter"));
    expect(errors.text).toContain("outcome = 'error'");
    expect(errors.text).toContain("analytics_daily");
    expect(errors.values).toContain("json-formatter");
  });

  it("keeps live filters parameterized", () => {
    const query = liveQuery(
      { from: new Date("2026-06-14T12:00:00.000Z"), to: now, slug: "jwt-decoder", source: "mcp" },
      "error",
      40,
    );
    expect(query.text).not.toContain("jwt-decoder");
    expect(query.text).not.toContain("analytics_daily");
    expect(query.values).toEqual([
      new Date("2026-06-14T12:00:00.000Z"),
      now,
      "mcp",
      "jwt-decoder",
      "error",
      40,
    ]);
  });

  it("resolves presets, comparison, and custom dates", () => {
    const week = resolveRange({ range: "7d", compare: "1" }, now);
    expect(week.to.getTime() - week.from.getTime()).toBe(7 * 86_400_000);
    expect(week.previousTo.getTime()).toBe(week.from.getTime());
    expect(week.previousFrom.getTime()).toBe(week.from.getTime() - 7 * 86_400_000);
    expect(week.compare).toBe(true);
    const custom = resolveRange({ range: "custom", from: "2026-06-01", to: "2026-06-03" }, now);
    expect(custom.from.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    expect(custom.to.toISOString()).toBe("2026-06-04T00:00:00.000Z");
    const invalid = resolveRange({ range: "custom", from: "nope", to: "nope" }, now);
    expect(invalid.preset).toBe("30d");
    expect(durationMode(resolveRange({ range: "7d" }, now))).toBe("percentile");
    expect(durationMode(resolveRange({ range: "30d" }, now))).toBe("histogram");
  });

  it("stacks sources, fills empty buckets, and keeps unused tools", () => {
    const stacked = stackRuns([
      { bucket: "2026-06-01", source: "web", runs: 2, ok: 2, err: 0, rejected: 0 },
      { bucket: "2026-06-01", source: "mcp", runs: 1, ok: 0, err: 1, rejected: 0 },
    ]);
    expect(stacked.series).toEqual([{ bucket: "2026-06-01", web: 2, mcp: 1, api: 0 }]);
    expect(stacked.runs).toBe(3);
    const filled = fillBuckets(new Date("2026-06-01T00:00:00.000Z"), new Date("2026-06-03T00:00:00.000Z"), "day", stacked.series);
    expect(filled.map((point) => point.bucket)).toEqual(["2026-06-01", "2026-06-02"]);
    expect(filled[1]).toEqual({ bucket: "2026-06-02", web: 0, mcp: 0, api: 0 });
    const usage: UsageRow = { slug: "json-formatter", runs: 4, ok: 3, errors: 1, rejected: 0, web: 4, mcp: 0, api: 0 };
    const rows = mergeToolRows(
      [
        { slug: "json-formatter", name: "JSON formatter" },
        { slug: "unused-tool", name: "Unused" },
      ],
      [usage],
      [],
      [{ slug: "json-formatter", opens: 8 }],
      [{ slug: "json-formatter", users: 2 }],
      [{ slug: "json-formatter", p50: 20, p95: 80 }],
      [{ slug: "json-formatter", bucket: "2026-06-01", runs: 4 }],
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]?.slug).toBe("json-formatter");
    expect(rows[0]?.conversion).toBe(0.5);
    expect(rows[0]?.success).toBe(0.75);
    expect(rows[1]).toMatchObject({ slug: "unused-tool", runs: 0, conversion: null, p50: null });
    expect(percentDelta(10, 5)).toBe(1);
    expect(percentDelta(1, 0)).toBeNull();
  });

  it("flags searches that match nothing in the catalog", () => {
    const catalog = [{ slug: "json-formatter", name: "JSON formatter", tagline: "Pretty print", description: "Format JSON", tags: ["json"], keywords: ["pretty"] }];
    expect(zeroResultFlags(["json"], catalog)).toEqual([false]);
    expect(zeroResultFlags(["zzzz-not-a-tool"], catalog)).toEqual([true]);
  });

  it("treats admin paths as private analytics", () => {
    expect(isAdminPath("/admin")).toBe(true);
    expect(isAdminPath("/admin/tools")).toBe(true);
    expect(isAdminPath("/administration")).toBe(false);
    expect(isAdminPath("/")).toBe(false);
  });
});
