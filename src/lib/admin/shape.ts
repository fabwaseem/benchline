import Fuse from "fuse.js";
import { emptyHistogram, percentileFromHist } from "@/lib/analytics/duration";

export type RunPoint = {
  bucket: string;
  source: string;
  runs: number;
  ok: number;
  err: number;
  rejected: number;
};

export type StackedPoint = { bucket: string; web: number; mcp: number; api: number };

export type UsageRow = {
  slug: string;
  runs: number;
  ok: number;
  errors: number;
  rejected: number;
  web: number;
  mcp: number;
  api: number;
};

export type CatalogTool = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  tags: string[];
  keywords: string[];
};

export type ToolRow = {
  slug: string;
  name: string;
  runs: number;
  users: number;
  opens: number;
  web: number;
  mcp: number;
  api: number;
  success: number;
  errors: number;
  rejected: number;
  errorRate: number;
  conversion: number | null;
  p50: number | null;
  p95: number | null;
  previousRuns: number;
  spark: number[];
};

export function rate(part: number, total: number): number {
  if (total <= 0) return 0;
  return part / total;
}

export function percentDelta(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / Math.abs(previous);
}

export function stackRuns(rows: RunPoint[]): {
  series: StackedPoint[];
  runs: number;
  ok: number;
  errors: number;
  rejected: number;
  sparkRuns: number[];
  sparkSuccess: number[];
} {
  const map = new Map<string, StackedPoint>();
  let runs = 0;
  let ok = 0;
  let errors = 0;
  let rejected = 0;
  for (const row of rows) {
    const point = map.get(row.bucket) ?? { bucket: row.bucket, web: 0, mcp: 0, api: 0 };
    if (row.source === "web" || row.source === "mcp" || row.source === "api") point[row.source] += row.runs;
    map.set(row.bucket, point);
    runs += row.runs;
    ok += row.ok;
    errors += row.err;
    rejected += row.rejected;
  }
  const series = [...map.values()].sort((a, b) => a.bucket.localeCompare(b.bucket));
  return {
    series,
    runs,
    ok,
    errors,
    rejected,
    sparkRuns: series.map((point) => point.web + point.mcp + point.api),
    sparkSuccess: series.map((point) => {
      const total = point.web + point.mcp + point.api;
      const match = rows.filter((row) => row.bucket === point.bucket);
      const good = match.reduce((sum, row) => sum + row.ok, 0);
      return total > 0 ? good / total : 0;
    }),
  };
}

export function fillBuckets(from: Date, to: Date, unit: "hour" | "day", rows: StackedPoint[]): StackedPoint[] {
  const map = new Map(rows.map((row) => [row.bucket, row]));
  const out: StackedPoint[] = [];
  const cursor = truncate(from, unit);
  const end = to.getTime();
  const step = unit === "hour" ? 60 * 60 * 1000 : 86_400_000;
  let guard = 0;
  while (cursor.getTime() < end && guard < 400) {
    const key = bucketKey(cursor, unit);
    out.push(map.get(key) ?? { bucket: key, web: 0, mcp: 0, api: 0 });
    cursor.setTime(cursor.getTime() + step);
    guard += 1;
  }
  return out;
}

function truncate(date: Date, unit: "hour" | "day"): Date {
  if (unit === "day") return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours()));
}

export function bucketKey(date: Date, unit: "hour" | "day"): string {
  const iso = date.toISOString();
  return unit === "day" ? iso.slice(0, 10) : `${iso.slice(0, 13)}:00`;
}

export function parseHist(value: unknown): number[] {
  const hist = emptyHistogram();
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.replace(/[{}]/g, "").split(",")
      : [];
  source.forEach((item, index) => {
    if (index < hist.length) hist[index] = num(item);
  });
  return hist;
}

export function sumHists(rows: number[][]): number[] {
  const total = emptyHistogram();
  for (const row of rows) {
    for (let index = 0; index < total.length; index += 1) total[index] = (total[index] ?? 0) + (row[index] ?? 0);
  }
  return total;
}

export function histPercentiles(hist: number[]): { p50: number | null; p95: number | null; samples: number } {
  const samples = hist.reduce((sum, count) => sum + count, 0);
  if (samples <= 0) return { p50: null, p95: null, samples: 0 };
  return { p50: percentileFromHist(hist, 0.5), p95: percentileFromHist(hist, 0.95), samples };
}

export function mergeToolRows(
  catalog: { slug: string; name: string }[],
  usage: UsageRow[],
  previous: UsageRow[],
  opens: { slug: string; opens: number }[],
  users: { slug: string; users: number }[],
  durations: { slug: string; p50: number | null; p95: number | null }[],
  series: { slug: string; bucket: string; runs: number }[],
): ToolRow[] {
  const bySlug = new Map(usage.map((row) => [row.slug, row]));
  const prev = new Map(previous.map((row) => [row.slug, row.runs]));
  const openMap = new Map(opens.map((row) => [row.slug, row.opens]));
  const userMap = new Map(users.map((row) => [row.slug, row.users]));
  const durationMap = new Map(durations.map((row) => [row.slug, row]));
  const sparks = new Map<string, { bucket: string; runs: number }[]>();
  for (const point of series) {
    const list = sparks.get(point.slug) ?? [];
    list.push(point);
    sparks.set(point.slug, list);
  }
  const known = new Set(catalog.map((tool) => tool.slug));
  const extras = usage.filter((row) => row.slug && !known.has(row.slug)).map((row) => ({ slug: row.slug, name: row.slug }));
  return [...catalog, ...extras]
    .map((tool) => {
      const row = bySlug.get(tool.slug);
      const runs = row?.runs ?? 0;
      const ok = row?.ok ?? 0;
      const errors = row?.errors ?? 0;
      const web = row?.web ?? 0;
      const openCount = openMap.get(tool.slug) ?? 0;
      const spark = (sparks.get(tool.slug) ?? []).sort((a, b) => a.bucket.localeCompare(b.bucket)).map((point) => point.runs);
      const duration = durationMap.get(tool.slug);
      return {
        slug: tool.slug,
        name: tool.name,
        runs,
        users: userMap.get(tool.slug) ?? 0,
        opens: openCount,
        web,
        mcp: row?.mcp ?? 0,
        api: row?.api ?? 0,
        success: rate(ok, runs),
        errors,
        rejected: row?.rejected ?? 0,
        errorRate: rate(errors, runs),
        conversion: openCount > 0 ? web / openCount : null,
        p50: duration?.p50 ?? null,
        p95: duration?.p95 ?? null,
        previousRuns: prev.get(tool.slug) ?? 0,
        spark,
      };
    })
    .sort((a, b) => b.runs - a.runs || a.name.localeCompare(b.name));
}

export function zeroResultFlags(queries: string[], catalog: CatalogTool[]): boolean[] {
  if (catalog.length === 0) return queries.map(() => true);
  const fuse = new Fuse(catalog, {
    keys: ["name", "tagline", "description", "tags", "keywords"],
    threshold: 0.35,
    ignoreLocation: true,
  });
  return queries.map((query) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return false;
    const direct = catalog.some((tool) =>
      [tool.name, tool.tagline, tool.description, ...tool.tags, ...tool.keywords].join("\n").toLowerCase().includes(needle),
    );
    if (direct) return false;
    return fuse.search(query).length === 0;
  });
}

export function num(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return 0;
}

export function str(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return "";
}

export function countryName(code: string): string {
  if (!code) return "Unknown";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}
