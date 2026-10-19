import { connection } from "next/server";
import { csvResponse } from "@/lib/admin/csv";
import { notConfigured, privateJson, requireSession } from "@/lib/admin/http";
import { loadErrors, loadLive, loadMcp, loadOverview, loadTools } from "@/lib/admin/load";
import { firstParam, liveFilters, resolveRange } from "@/lib/admin/range";
import { adminEnv } from "@/lib/admin/config";
import { formatPercent } from "@/lib/admin/format";

const TABLES = ["tools", "countries", "referrers", "utms", "searches", "errors", "clients", "devices", "sources", "live", "protocols", "hosts"] as const;
type TableName = (typeof TABLES)[number];

function isTable(value: string | null): value is TableName {
  return TABLES.some((table) => table === value);
}

async function bindRequest(): Promise<void> {
  try {
    await connection();
  } catch (error) {
    if (error instanceof Error && error.message.includes("outside a request scope")) return;
    throw error;
  }
}

export async function GET(request: Request) {
  await bindRequest();
  if (!adminEnv()) return notConfigured();
  const gate = await requireSession(request);
  if (gate instanceof Response) return gate;
  const url = new URL(request.url);
  const table = url.searchParams.get("table");
  if (!isTable(table)) return privateJson({ error: "Unknown table." }, 400);
  const range = resolveRange({
    range: url.searchParams.get("range"),
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
    compare: url.searchParams.get("compare"),
  });
  const filters = liveFilters({
    source: url.searchParams.get("source"),
    slug: firstParam(url.searchParams.get("slug") ?? undefined),
    outcome: url.searchParams.get("outcome"),
  });
  const stamp = range.from.toISOString().slice(0, 10);
  if (table === "tools") {
    const loaded = await loadTools(range);
    if (!loaded.ok) return privateJson({ error: "Export failed." }, loaded.error === "unavailable" ? 503 : 500);
    return csvResponse(`benchline-tools-${stamp}.csv`, loaded.data.map((row) => ({
      tool: row.name,
      slug: row.slug,
      runs: row.runs,
      users: row.users,
      success: formatPercent(row.success),
      p50: row.p50,
      p95: row.p95,
      web: row.web,
      mcp: row.mcp,
      api: row.api,
      opens: row.opens,
      conversion: row.conversion === null ? null : formatPercent(row.conversion),
      previous_runs: row.previousRuns,
    })));
  }
  if (table === "errors") {
    const loaded = await loadErrors(range);
    if (!loaded.ok) return privateJson({ error: "Export failed." }, loaded.error === "unavailable" ? 503 : 500);
    return csvResponse(`benchline-errors-${stamp}.csv`, loaded.data.groups.map((row) => ({
      tool: row.name,
      slug: row.slug,
      code: row.code,
      count: row.count,
    })));
  }
  if (table === "live") {
    const loaded = await loadLive(filters);
    if (!loaded.ok) return privateJson({ error: "Export failed." }, loaded.error === "unavailable" ? 503 : 500);
    return csvResponse(`benchline-live-${stamp}.csv`, loaded.data.map((row) => ({
      time: row.ts,
      tool: row.slug,
      source: row.source,
      outcome: row.outcome,
      error: row.errorCode,
      duration_ms: row.durationMs,
      country: row.country,
      client: row.client,
      version: row.version,
      host: row.host,
    })));
  }
  if (table === "clients" || table === "protocols" || table === "hosts") {
    const loaded = await loadMcp(range);
    if (!loaded.ok) return privateJson({ error: "Export failed." }, loaded.error === "unavailable" ? 503 : 500);
    if (table === "clients") {
      return csvResponse(`benchline-mcp-clients-${stamp}.csv`, loaded.data.clients.map((row) => ({ name: row.name, version: row.version, runs: row.runs })));
    }
    if (table === "protocols") {
      return csvResponse(`benchline-mcp-protocols-${stamp}.csv`, loaded.data.protocols.map((row) => ({ protocol: row.protocol, runs: row.runs })));
    }
    return csvResponse(`benchline-mcp-hosts-${stamp}.csv`, loaded.data.hosts.map((row) => ({ host: row.host, runs: row.runs, sessions: row.sessions })));
  }
  const loaded = await loadOverview(range);
  if (!loaded.ok) return privateJson({ error: "Export failed." }, loaded.error === "unavailable" ? 503 : 500);
  const data = loaded.data;
  if (table === "countries") return csvResponse(`benchline-countries-${stamp}.csv`, data.countries.map((row) => ({ country: row.country, name: row.name, runs: row.runs })));
  if (table === "referrers") return csvResponse(`benchline-referrers-${stamp}.csv`, data.referrers.map((row) => ({ host: row.host, views: row.views })));
  if (table === "utms") return csvResponse(`benchline-utms-${stamp}.csv`, data.utms.map((row) => ({ source: row.source, medium: row.medium, campaign: row.campaign, views: row.views })));
  if (table === "searches") return csvResponse(`benchline-searches-${stamp}.csv`, data.searches.map((row) => ({ query: row.query, count: row.count, zero_results: row.zero ? "yes" : "no" })));
  if (table === "devices") return csvResponse(`benchline-devices-${stamp}.csv`, data.devices.map((row) => ({ device: row.device, views: row.views })));
  return csvResponse(`benchline-sources-${stamp}.csv`, data.bySource.map((row) => ({ source: row.source, runs: row.runs })));
}
