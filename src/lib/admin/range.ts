import { utcDay } from "@/lib/analytics/text";
import type { RunOutcome, RunSource } from "@/lib/analytics/types";

export const RANGE_PRESETS = ["24h", "7d", "30d", "90d", "custom"] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number];

const SPANS: Record<Exclude<RangePreset, "custom">, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 86_400_000,
  "30d": 30 * 86_400_000,
  "90d": 90 * 86_400_000,
};

const MAX_SPAN = 366 * 86_400_000;

export type AdminRange = {
  preset: RangePreset;
  from: Date;
  to: Date;
  compare: boolean;
  previousFrom: Date;
  previousTo: Date;
};

export type AdminScope = {
  from: Date;
  to: Date;
  slug: string | null;
  source: RunSource | null;
  unit: "hour" | "day";
};

function fallback(now: Date, compare: boolean): AdminRange {
  const to = now;
  const from = new Date(now.getTime() - SPANS["30d"]);
  return finish("30d", from, to, compare);
}

function finish(preset: RangePreset, from: Date, to: Date, compare: boolean): AdminRange {
  const span = to.getTime() - from.getTime();
  return {
    preset,
    from,
    to,
    compare,
    previousFrom: new Date(from.getTime() - span),
    previousTo: new Date(from.getTime()),
  };
}

function parseInstant(value: string | null | undefined): Date | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function customRange(fromRaw: string | null | undefined, toRaw: string | null | undefined): { from: Date; to: Date } | null {
  const from = parseInstant(fromRaw);
  let to = parseInstant(toRaw);
  if (!from || !to) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(toRaw ?? "")) to = new Date(to.getTime() + 86_400_000);
  if (from.getTime() >= to.getTime()) return null;
  if (to.getTime() - from.getTime() > MAX_SPAN) return null;
  return { from, to };
}

export function resolveRange(
  input: {
    range?: string | null;
    from?: string | null;
    to?: string | null;
    compare?: string | null;
  },
  now = new Date(),
): AdminRange {
  const compare = input.compare === "1" || input.compare === "true";
  if (input.range === "24h" || input.range === "7d" || input.range === "30d" || input.range === "90d") {
    const to = now;
    const from = new Date(now.getTime() - SPANS[input.range]);
    return finish(input.range, from, to, compare);
  }
  if (input.range === "custom") {
    const parsed = customRange(input.from, input.to);
    if (parsed) return finish("custom", parsed.from, parsed.to, compare);
  }
  return fallback(now, compare);
}

export function bucketUnit(range: Pick<AdminRange, "from" | "to">): "hour" | "day" {
  return range.to.getTime() - range.from.getTime() <= 48 * 60 * 60 * 1000 ? "hour" : "day";
}

/** Exact percentiles on short windows. Longer windows use the duration histogram. */
export function durationMode(range: Pick<AdminRange, "from" | "to">): "percentile" | "histogram" {
  return range.to.getTime() - range.from.getTime() <= 14 * 86_400_000 ? "percentile" : "histogram";
}

export function scopeFrom(
  range: Pick<AdminRange, "from" | "to">,
  opts?: { slug?: string | null; source?: RunSource | null },
): AdminScope {
  return {
    from: range.from,
    to: range.to,
    slug: opts?.slug ?? null,
    source: opts?.source ?? null,
    unit: bucketUnit(range),
  };
}

export function previousScope(range: AdminRange, opts?: { slug?: string | null; source?: RunSource | null }): AdminScope {
  return scopeFrom({ from: range.previousFrom, to: range.previousTo }, opts);
}

export function rangeQuery(range: AdminRange, extra?: Record<string, string | null | undefined>): string {
  const params = new URLSearchParams();
  params.set("range", range.preset);
  if (range.preset === "custom") {
    params.set("from", range.from.toISOString());
    params.set("to", range.to.toISOString());
  }
  if (range.compare) params.set("compare", "1");
  for (const [key, value] of Object.entries(extra ?? {})) {
    if (value) params.set(key, value);
  }
  return params.toString();
}

export function rangeLabel(range: AdminRange): string {
  if (range.preset === "24h") return "Last 24 hours";
  if (range.preset === "7d") return "Last 7 days";
  if (range.preset === "30d") return "Last 30 days";
  if (range.preset === "90d") return "Last 90 days";
  const end = new Date(range.to.getTime() - 1);
  return `${utcDay(range.from)} – ${utcDay(end)}`;
}

export function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function liveFilters(input: { source?: string | null; slug?: string | null; outcome?: string | null }): {
  source: RunSource | null;
  slug: string | null;
  outcome: RunOutcome | null;
} {
  const source = input.source === "web" || input.source === "mcp" || input.source === "api" ? input.source : null;
  const outcome = input.outcome === "ok" || input.outcome === "error" || input.outcome === "rejected" ? input.outcome : null;
  const slug = input.slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug) ? input.slug : null;
  return { source, slug, outcome };
}
