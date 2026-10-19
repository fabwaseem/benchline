import { connection } from "next/server";
import { safeError } from "@/lib/analytics/clean";
import type { Sql as Db } from "@/lib/analytics/db";
import { analyticsRuntime } from "@/lib/analytics/global";
import { getAnalyticsStore } from "@/lib/analytics/store";
import { queryTimeoutMs } from "@/lib/admin/config";
import {
  clientsQuery,
  countriesQuery,
  durationHistogramByToolQuery,
  durationHistogramQuery,
  durationPercentileQuery,
  errorsQuery,
  liveQuery,
  mcpHostQuery,
  mcpProtocolQuery,
  mcpSessionsQuery,
  opensQuery,
  pageViewsQuery,
  referrersQuery,
  rolledMcpQuery,
  rolledSearchesQuery,
  runsSeriesQuery,
  searchesQuery,
  toolSeriesQuery,
  toolUsageQuery,
  utmQuery,
  devicesQuery,
  visitorsByToolQuery,
  visitorsQuery,
  type Sql,
} from "@/lib/admin/queries";
import { durationMode, previousScope, scopeFrom, type AdminRange, type AdminScope } from "@/lib/admin/range";
import {
  countryName,
  fillBuckets,
  histPercentiles,
  mergeToolRows,
  num,
  parseHist,
  rate,
  stackRuns,
  str,
  sumHists,
  zeroResultFlags,
  type RunPoint,
  type UsageRow,
} from "@/lib/admin/shape";
import type { ErrorReport, LiveEvent, Load, McpReport, Overview, ToolDetail, ToolRow } from "@/lib/admin/types";
import type { RunOutcome, RunSource } from "@/lib/analytics/types";
import { tools } from "@/registry";

type Tx = { unsafe(query: string, parameters?: unknown[]): Promise<unknown> };

const catalog = () => tools.map((tool) => ({ slug: tool.slug, name: tool.name }));
const searchCatalog = () =>
  tools.map((tool) => ({
    slug: tool.slug,
    name: tool.name,
    tagline: tool.tagline,
    description: tool.description,
    tags: [...tool.tags],
    keywords: [...tool.keywords],
  }));

function rowsOf(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object");
}

async function query(tx: Tx, sql: Sql): Promise<Record<string, unknown>[]> {
  return rowsOf(await tx.unsafe(sql.text, sql.values));
}

function isTimeout(error: unknown): boolean {
  const message = error instanceof Error ? error.message : "";
  return /statement timeout|canceling statement/i.test(message);
}

async function withAdminDb<T>(run: (tx: Tx) => Promise<T>): Promise<Load<T>> {
  if (!process.env.DATABASE_URL) return { ok: false, error: "unavailable" };
  const store = await getAnalyticsStore();
  const sql = analyticsRuntime().sql as Db | null;
  if (!store || !sql) return { ok: false, error: "unavailable" };
  try {
    const wrapped = await sql.begin(async (tx) => {
      await tx.unsafe("select set_config('statement_timeout', $1, true)", [`${queryTimeoutMs()}ms`]);
      return { data: await run(tx) };
    });
    return { ok: true, data: wrapped.data };
  } catch (error) {
    console.warn("[admin] query failed", safeError(error));
    return { ok: false, error: isTimeout(error) ? "timeout" : "failed" };
  }
}

function points(rows: Record<string, unknown>[]): RunPoint[] {
  return rows.map((row) => ({
    bucket: str(row.bucket).slice(0, 16),
    source: str(row.source),
    runs: num(row.runs),
    ok: num(row.ok),
    err: num(row.err),
    rejected: num(row.rejected),
  }));
}

function usage(rows: Record<string, unknown>[]): UsageRow[] {
  return rows.map((row) => ({
    slug: str(row.slug),
    runs: num(row.runs),
    ok: num(row.ok),
    errors: num(row.errors),
    rejected: num(row.rejected),
    web: num(row.web),
    mcp: num(row.mcp),
    api: num(row.api),
  }));
}

function names(): Map<string, string> {
  return new Map(tools.map((tool) => [tool.slug, tool.name]));
}

function metric(value: number | null, previous: number | null, spark: number[]) {
  return { value, previous, spark };
}

async function scalar(tx: Tx, sql: Sql, column: string): Promise<number> {
  const row = (await query(tx, sql))[0];
  return num(row?.[column]);
}

async function seriesNumbers(tx: Tx, sql: Sql, column: string): Promise<number[]> {
  return (await query(tx, sql)).map((row) => num(row[column]));
}

async function durationHeadline(tx: Tx, scope: AdminScope, mode: "percentile" | "histogram") {
  if (mode === "percentile") {
    const row = (await query(tx, durationPercentileQuery(scope, false)))[0];
    const samples = num(row?.samples);
    if (samples > 0) {
      return {
        p50: row?.p50 === null || row?.p50 === undefined ? null : Math.round(num(row.p50)),
        p95: row?.p95 === null || row?.p95 === undefined ? null : Math.round(num(row.p95)),
        source: "percentile" as const,
      };
    }
  }
  const hists = (await query(tx, durationHistogramQuery(scope))).map((row) => parseHist(row.hist));
  const combined = histPercentiles(sumHists(hists));
  if (combined.samples <= 0) return { p50: null, p95: null, source: "none" as const };
  return { p50: combined.p50, p95: combined.p95, source: "histogram" as const };
}

async function durationSpark(tx: Tx, scope: AdminScope, mode: "percentile" | "histogram", which: "p50" | "p95"): Promise<number[]> {
  if (mode !== "percentile") return [];
  return (await query(tx, durationPercentileQuery(scope, true))).map((row) => {
    const value = row[which];
    return value === null || value === undefined ? 0 : Math.round(num(value));
  });
}

function bySource(rows: UsageRow[]) {
  const totals = { web: 0, mcp: 0, api: 0 };
  for (const row of rows) {
    totals.web += row.web;
    totals.mcp += row.mcp;
    totals.api += row.api;
  }
  return (["web", "mcp", "api"] as const)
    .map((source) => ({ source, runs: totals[source] }))
    .filter((row) => row.runs > 0)
    .sort((a, b) => b.runs - a.runs);
}

function byOutcome(rows: UsageRow[]) {
  let ok = 0;
  let error = 0;
  let rejected = 0;
  for (const row of rows) {
    ok += row.ok;
    error += row.errors;
    rejected += row.rejected;
  }
  return [
    { outcome: "ok", runs: ok },
    { outcome: "error", runs: error },
    { outcome: "rejected", runs: rejected },
  ].filter((row) => row.runs > 0);
}

export async function loadOverview(range: AdminRange): Promise<Load<Overview>> {
  const scope = scopeFrom(range);
  const previous = previousScope(range);
  const mode = durationMode(range);
  return withAdminDb(async (tx) => {
    const currentPoints = points(await query(tx, runsSeriesQuery(scope)));
    const stacked = stackRuns(currentPoints);
    const series = fillBuckets(range.from, range.to, scope.unit, stacked.series);
    const prevPoints = range.compare ? stackRuns(points(await query(tx, runsSeriesQuery(previous)))) : null;
    const visitors = await scalar(tx, visitorsQuery(scope, false), "visitors");
    const visitorSpark = await seriesNumbers(tx, visitorsQuery(scope, true), "visitors");
    const prevVisitors = range.compare ? await scalar(tx, visitorsQuery(previous, false), "visitors") : null;
    const views = await scalar(tx, pageViewsQuery(scope, false), "views");
    const viewSpark = await seriesNumbers(tx, pageViewsQuery(scope, true), "views");
    const prevViews = range.compare ? await scalar(tx, pageViewsQuery(previous, false), "views") : null;
    const sessions = await scalar(tx, mcpSessionsQuery(scope, false), "sessions");
    const sessionSpark = await seriesNumbers(tx, mcpSessionsQuery(scope, true), "sessions");
    const prevSessions = range.compare ? await scalar(tx, mcpSessionsQuery(previous, false), "sessions") : null;
    const duration = await durationHeadline(tx, scope, mode);
    const prevDuration = range.compare ? await durationHeadline(tx, previous, mode) : null;
    const p50Spark = await durationSpark(tx, scope, mode, "p50");
    const p95Spark = await durationSpark(tx, scope, mode, "p95");
    const used = usage(await query(tx, toolUsageQuery(scope)));
    const nameFor = names();
    const countries = (await query(tx, countriesQuery(scope))).map((row) => ({
      country: str(row.country),
      name: countryName(str(row.country)),
      runs: num(row.runs),
    }));
    const clients = (await query(tx, clientsQuery(scope))).map((row) => ({
      name: str(row.name),
      version: str(row.version),
      runs: num(row.runs),
    }));
    const referrers = (await query(tx, referrersQuery(scope))).map((row) => ({ host: str(row.host), views: num(row.views) }));
    const utms = (await query(tx, utmQuery(scope))).map((row) => ({
      source: str(row.source),
      medium: str(row.medium),
      campaign: str(row.campaign),
      views: num(row.views),
    }));
    const devices = (await query(tx, devicesQuery(scope))).map((row) => ({ device: str(row.device), views: num(row.views) }));
    const searchRows = (await query(tx, searchesQuery(scope))).map((row) => ({ query: str(row.query), count: num(row.count) }));
    const zeros = zeroResultFlags(searchRows.map((row) => row.query), searchCatalog());
    const rolledSearches = await scalar(tx, rolledSearchesQuery(scope), "rolled");
    const totalRuns = used.reduce((sum, row) => sum + row.runs, 0);
    const totalOk = used.reduce((sum, row) => sum + row.ok, 0);
    return {
      runs: metric(totalRuns || stacked.runs, prevPoints ? prevPoints.runs : null, series.map((point) => point.web + point.mcp + point.api)),
      visitors: metric(visitors, prevVisitors, visitorSpark),
      success: metric(rate(totalOk || stacked.ok, totalRuns || stacked.runs), prevPoints ? rate(prevPoints.ok, prevPoints.runs) : null, stacked.sparkSuccess),
      p50: metric(duration.p50, prevDuration?.p50 ?? null, p50Spark),
      p95: metric(duration.p95, prevDuration?.p95 ?? null, p95Spark),
      mcpSessions: metric(sessions, prevSessions, sessionSpark),
      pageViews: metric(views, prevViews, viewSpark),
      series,
      topTools: [...used]
        .sort((a, b) => b.runs - a.runs || a.slug.localeCompare(b.slug))
        .slice(0, 8)
        .map((row) => ({ slug: row.slug, name: nameFor.get(row.slug) ?? row.slug, runs: row.runs })),
      bySource: bySource(used),
      byOutcome: byOutcome(used),
      countries,
      clients,
      referrers,
      utms,
      devices,
      searches: searchRows.map((row, index) => ({ ...row, zero: zeros[index] ?? false })),
      rolledSearches,
      errorRates: [...used]
        .filter((row) => row.runs > 0)
        .map((row) => ({
          slug: row.slug,
          name: nameFor.get(row.slug) ?? row.slug,
          errors: row.errors,
          runs: row.runs,
          rate: rate(row.errors, row.runs),
        }))
        .sort((a, b) => b.rate - a.rate || b.errors - a.errors)
        .slice(0, 12),
      durationSource: duration.source,
    };
  });
}

async function durationByTool(tx: Tx, scope: AdminScope) {
  const grouped = new Map<string, number[]>();
  for (const row of await query(tx, durationHistogramByToolQuery(scope))) {
    const slug = str(row.slug);
    grouped.set(slug, sumHists([grouped.get(slug) ?? [], parseHist(row.hist)]));
  }
  return [...grouped.entries()].map(([slug, hist]) => ({ slug, ...histPercentiles(hist) }));
}

export async function loadTools(range: AdminRange): Promise<Load<ToolRow[]>> {
  const scope = scopeFrom(range);
  const previous = previousScope(range);
  return withAdminDb(async (tx) => {
    const rows = mergeToolRows(
      catalog(),
      usage(await query(tx, toolUsageQuery(scope))),
      usage(await query(tx, toolUsageQuery(previous))),
      (await query(tx, opensQuery(scope))).map((row) => ({ slug: str(row.slug), opens: num(row.opens) })),
      (await query(tx, visitorsByToolQuery(scope))).map((row) => ({ slug: str(row.slug), users: num(row.users) })),
      await durationByTool(tx, scope),
      (await query(tx, toolSeriesQuery(scope))).map((row) => ({ slug: str(row.slug), bucket: str(row.bucket), runs: num(row.runs) })),
    );
    return rows;
  });
}

function liveEvents(rows: Record<string, unknown>[]): LiveEvent[] {
  return rows.flatMap((row) => {
    const source = str(row.source);
    const outcome = str(row.outcome);
    if (source !== "web" && source !== "mcp" && source !== "api") return [];
    if (outcome !== "ok" && outcome !== "error" && outcome !== "rejected") return [];
    const ts = row.ts instanceof Date ? row.ts.toISOString() : str(row.ts);
    return [
      {
        id: str(row.id),
        ts,
        slug: str(row.slug),
        source,
        outcome,
        errorCode: str(row.error_code) || null,
        durationMs: row.duration_ms === null || row.duration_ms === undefined ? null : num(row.duration_ms),
        country: str(row.country) || null,
        client: str(row.mcp_client_name) || null,
        version: str(row.mcp_client_version) || null,
        protocol: str(row.mcp_protocol) || null,
        host: str(row.mcp_host) || null,
      },
    ];
  });
}

export async function loadLive(filter: { source: RunSource | null; slug: string | null; outcome: RunOutcome | null }): Promise<Load<LiveEvent[]>> {
  await connection();
  const to = new Date();
  const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
  return withAdminDb(async (tx) => liveEvents(await query(tx, liveQuery({ from, to, ...filter }, filter.outcome, 80))));
}

export async function loadTool(slug: string, range: AdminRange): Promise<Load<ToolDetail>> {
  const scope = scopeFrom(range, { slug });
  const previous = previousScope(range, { slug });
  const mode = durationMode(range);
  return withAdminDb(async (tx) => {
    const rows = mergeToolRows(
      catalog().filter((tool) => tool.slug === slug),
      usage(await query(tx, toolUsageQuery(scope))),
      usage(await query(tx, toolUsageQuery(previous))),
      (await query(tx, opensQuery(scope))).map((row) => ({ slug: str(row.slug), opens: num(row.opens) })),
      (await query(tx, visitorsByToolQuery(scope))).map((row) => ({ slug: str(row.slug), users: num(row.users) })),
      mode === "percentile"
        ? await (async () => {
            const headline = await durationHeadline(tx, scope, "percentile");
            return [{ slug, p50: headline.p50, p95: headline.p95 }];
          })()
        : await durationByTool(tx, scope),
      [],
    );
    const tool = rows[0];
    if (!tool) {
      return {
        tool: {
          slug,
          name: slug,
          runs: 0,
          users: 0,
          opens: 0,
          web: 0,
          mcp: 0,
          api: 0,
          success: 0,
          errors: 0,
          rejected: 0,
          errorRate: 0,
          conversion: null,
          p50: null,
          p95: null,
          previousRuns: 0,
          spark: [],
        },
        series: [],
        errors: [],
        clients: [],
        countries: [],
        sources: [],
        recent: [],
        durationSource: "none",
      };
    }
    const stacked = stackRuns(points(await query(tx, runsSeriesQuery(scope))));
    const errorRows = await query(tx, errorsQuery(scope));
    const errorMap = new Map<string, number>();
    for (const row of errorRows) errorMap.set(str(row.code), (errorMap.get(str(row.code)) ?? 0) + num(row.n));
    const duration = await durationHeadline(tx, scope, mode);
    return {
      tool: { ...tool, p50: duration.p50, p95: duration.p95 },
      series: fillBuckets(range.from, range.to, scope.unit, stacked.series),
      errors: [...errorMap.entries()].map(([code, count]) => ({ code, count })).sort((a, b) => b.count - a.count),
      clients: (await query(tx, clientsQuery(scope))).map((row) => ({ name: str(row.name), version: str(row.version), runs: num(row.runs) })),
      countries: (await query(tx, countriesQuery(scope))).map((row) => ({
        country: str(row.country),
        name: countryName(str(row.country)),
        runs: num(row.runs),
      })),
      sources: [
        { source: "web", runs: tool.web },
        { source: "mcp", runs: tool.mcp },
        { source: "api", runs: tool.api },
      ].filter((row) => row.runs > 0),
      recent: liveEvents(await query(tx, liveQuery(scope, null, 25))),
      durationSource: duration.source,
    };
  });
}

export async function loadMcp(range: AdminRange): Promise<Load<McpReport>> {
  const scope = scopeFrom(range, { source: "mcp" });
  const previous = previousScope(range, { source: "mcp" });
  return withAdminDb(async (tx) => {
    const current = stackRuns(points(await query(tx, runsSeriesQuery(scope))));
    const prev = range.compare ? stackRuns(points(await query(tx, runsSeriesQuery(previous)))) : null;
    const sessions = await scalar(tx, mcpSessionsQuery(scope, false), "sessions");
    const sessionSpark = await seriesNumbers(tx, mcpSessionsQuery(scope, true), "sessions");
    const prevSessions = range.compare ? await scalar(tx, mcpSessionsQuery(previous, false), "sessions") : null;
    const nameFor = names();
    const used = usage(await query(tx, toolUsageQuery(scope)));
    return {
      sessions: metric(sessions, prevSessions, sessionSpark),
      calls: metric(current.runs, prev ? prev.runs : null, current.sparkRuns),
      clients: (await query(tx, clientsQuery(scopeFrom(range)))).map((row) => ({
        name: str(row.name),
        version: str(row.version),
        runs: num(row.runs),
      })),
      protocols: (await query(tx, mcpProtocolQuery(scope))).map((row) => ({ protocol: str(row.protocol), runs: num(row.runs) })),
      hosts: (await query(tx, mcpHostQuery(scope))).map((row) => ({ host: str(row.host), runs: num(row.runs), sessions: num(row.sessions) })),
      mix: [...used]
        .sort((a, b) => b.runs - a.runs || a.slug.localeCompare(b.slug))
        .slice(0, 12)
        .map((row) => ({ slug: row.slug, name: nameFor.get(row.slug) ?? row.slug, runs: row.runs })),
      rolled: await scalar(tx, rolledMcpQuery(scope), "rolled"),
      series: fillBuckets(range.from, range.to, scope.unit, current.series).map((point) => ({
        bucket: point.bucket,
        runs: point.web + point.mcp + point.api,
      })),
    };
  });
}

export async function loadErrors(range: AdminRange): Promise<Load<ErrorReport>> {
  const scope = scopeFrom(range);
  return withAdminDb(async (tx) => {
    const rows = await query(tx, errorsQuery(scope));
    const nameFor = names();
    const groups = new Map<string, { slug: string; code: string; count: number; spark: Map<string, number> }>();
    const series = new Map<string, number>();
    for (const row of rows) {
      const slug = str(row.slug);
      const code = str(row.code);
      const bucket = str(row.bucket);
      const count = num(row.n);
      const key = `${slug}\n${code}`;
      const group = groups.get(key) ?? { slug, code, count: 0, spark: new Map() };
      group.count += count;
      group.spark.set(bucket, (group.spark.get(bucket) ?? 0) + count);
      groups.set(key, group);
      series.set(bucket, (series.get(bucket) ?? 0) + count);
    }
    return {
      groups: [...groups.values()]
        .map((group) => ({
          slug: group.slug,
          name: nameFor.get(group.slug) ?? group.slug,
          code: group.code,
          count: group.count,
          spark: [...group.spark.entries()].sort((a, b) => a[0].localeCompare(b[0])).map((entry) => entry[1]),
        }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
      series: [...series.entries()]
        .map(([bucket, count]) => ({ bucket, count }))
        .sort((a, b) => a.bucket.localeCompare(b.bucket)),
    };
  });
}
