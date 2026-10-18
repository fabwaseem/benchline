import { percentile, percentileFromHist } from "@/lib/analytics/duration";
import type { AnalyticsEvent, RunOutcome, RunSource, StatsFilter, StatsReport, ToolRunEvent } from "@/lib/analytics/types";

export type CountRow = {
  slug: string;
  source: string;
  outcome: string;
  day: string;
  country: string;
  mcpClient: string;
  mcpVersion: string;
  runs: number;
  errors: number;
};

export type DurationSummary = {
  p50: number | null;
  p95: number | null;
  samples: number;
};

const SOURCES = new Set<RunSource>(["mcp", "api", "web"]);
const OUTCOMES = new Set<RunOutcome>(["ok", "error", "rejected"]);

function isSource(value: string): value is RunSource {
  return SOURCES.has(value as RunSource);
}

function isOutcome(value: string): value is RunOutcome {
  return OUTCOMES.has(value as RunOutcome);
}

function rate(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 10_000) / 10_000;
}

export function summarizeRuns(
  rows: CountRow[],
  duration: DurationSummary,
  histogram: number[] | null,
): Pick<
  StatsReport,
  "runs" | "byTool" | "bySource" | "byOutcome" | "byDay" | "errorRate" | "rejectedRate" | "duration" | "topMcpClients" | "topCountries"
> {
  const byTool = new Map<string, { slug: string; runs: number; ok: number; error: number; rejected: number }>();
  const bySource = new Map<RunSource, number>();
  const byOutcome = new Map<RunOutcome, number>();
  const byDay = new Map<string, { day: string; runs: number; ok: number; error: number; rejected: number }>();
  const clients = new Map<string, { name: string; version: string | null; runs: number }>();
  const countries = new Map<string, number>();
  let runs = 0;
  let errors = 0;
  let rejected = 0;

  for (const row of rows) {
    if (!isSource(row.source) || !isOutcome(row.outcome)) continue;
    runs += row.runs;
    if (row.outcome === "error") errors += row.runs;
    if (row.outcome === "rejected") rejected += row.runs;
    if (row.slug) {
      const tool = byTool.get(row.slug) ?? { slug: row.slug, runs: 0, ok: 0, error: 0, rejected: 0 };
      tool.runs += row.runs;
      tool[row.outcome] += row.runs;
      byTool.set(row.slug, tool);
    }
    bySource.set(row.source, (bySource.get(row.source) ?? 0) + row.runs);
    byOutcome.set(row.outcome, (byOutcome.get(row.outcome) ?? 0) + row.runs);
    const day = byDay.get(row.day) ?? { day: row.day, runs: 0, ok: 0, error: 0, rejected: 0 };
    day.runs += row.runs;
    day[row.outcome] += row.runs;
    byDay.set(row.day, day);
    if (row.source === "mcp" && row.mcpClient) {
      const key = `${row.mcpClient}\n${row.mcpVersion}`;
      const current = clients.get(key) ?? { name: row.mcpClient, version: row.mcpVersion || null, runs: 0 };
      current.runs += row.runs;
      clients.set(key, current);
    }
    if (row.country) countries.set(row.country, (countries.get(row.country) ?? 0) + row.runs);
  }

  let durationSource: StatsReport["duration"]["source"] = "none";
  let p50 = duration.p50;
  let p95 = duration.p95;
  let samples = duration.samples;
  if (samples > 0) durationSource = "raw";
  else if (histogram && histogram.some((count) => count > 0)) {
    p50 = percentileFromHist(histogram, 0.5);
    p95 = percentileFromHist(histogram, 0.95);
    samples = histogram.reduce((sum, count) => sum + count, 0);
    durationSource = "histogram";
  }

  return {
    runs,
    byTool: [...byTool.values()].sort((a, b) => b.runs - a.runs || a.slug.localeCompare(b.slug)).slice(0, 100),
    bySource: [...bySource.entries()].map(([source, count]) => ({ source, runs: count })).sort((a, b) => b.runs - a.runs),
    byOutcome: [...byOutcome.entries()].map(([outcome, count]) => ({ outcome, runs: count })).sort((a, b) => b.runs - a.runs),
    byDay: [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day)),
    errorRate: rate(errors, runs),
    rejectedRate: rate(rejected, runs),
    duration: { p50, p95, samples, source: durationSource },
    topMcpClients: [...clients.values()].sort((a, b) => b.runs - a.runs || a.name.localeCompare(b.name)).slice(0, 20),
    topCountries: [...countries.entries()]
      .map(([country, count]) => ({ country, runs: count }))
      .sort((a, b) => b.runs - a.runs || a.country.localeCompare(b.country))
      .slice(0, 20),
  };
}

export function runsInFilter(event: ToolRunEvent, filter: StatsFilter): boolean {
  const ts = new Date(event.ts).getTime();
  if (ts < filter.from.getTime() || ts >= filter.to.getTime()) return false;
  if (filter.slug && event.slug !== filter.slug) return false;
  if (filter.source && event.source !== filter.source) return false;
  return true;
}

export function durationFromRuns(events: ToolRunEvent[]): DurationSummary {
  const samples = events.flatMap((event) => (event.durationMs === null ? [] : [event.durationMs]));
  return {
    p50: percentile(samples, 0.5),
    p95: percentile(samples, 0.95),
    samples: samples.length,
  };
}

export function countRowsFromRuns(events: ToolRunEvent[]): CountRow[] {
  return events.map((event) => ({
    slug: event.slug,
    source: event.source,
    outcome: event.outcome,
    day: event.ts.slice(0, 10),
    country: event.country ?? "",
    mcpClient: event.mcpClientName ?? "",
    mcpVersion: event.mcpClientVersion ?? "",
    runs: 1,
    errors: event.outcome === "error" ? 1 : 0,
  }));
}

export function eventInRange(event: AnalyticsEvent, filter: StatsFilter): boolean {
  const ts = new Date(event.ts).getTime();
  return ts >= filter.from.getTime() && ts < filter.to.getTime();
}

export function emptyReport(filter: StatsFilter): StatsReport {
  return {
    from: filter.from.toISOString(),
    to: filter.to.toISOString(),
    slug: filter.slug,
    source: filter.source,
    runs: 0,
    byTool: [],
    bySource: [],
    byOutcome: [],
    byDay: [],
    errorRate: 0,
    rejectedRate: 0,
    duration: { p50: null, p95: null, samples: 0, source: "none" },
    topMcpClients: [],
    topCountries: [],
    pages: { views: 0, toolOpens: 0, searches: 0, copies: 0, downloads: 0 },
  };
}

export function mergeCountries(
  base: { country: string; runs: number }[],
  extra: { country: string; runs: number }[],
): { country: string; runs: number }[] {
  const map = new Map<string, number>();
  for (const row of [...base, ...extra]) {
    if (!row.country) continue;
    map.set(row.country, (map.get(row.country) ?? 0) + row.runs);
  }
  return [...map.entries()]
    .map(([country, runs]) => ({ country, runs }))
    .sort((a, b) => b.runs - a.runs || a.country.localeCompare(b.country))
    .slice(0, 20);
}

export function parseRange(fromRaw: string | null, toRaw: string | null, now = new Date()): { from: Date; to: Date } | null {
  const to = toRaw ? new Date(toRaw) : now;
  const from = fromRaw ? new Date(fromRaw) : new Date(to.getTime() - 30 * 86_400_000);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  if (from.getTime() >= to.getTime()) return null;
  if (to.getTime() - from.getTime() > 366 * 86_400_000) return null;
  return { from, to };
}
