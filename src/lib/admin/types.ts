import type { RunOutcome, RunSource } from "@/lib/analytics/types";
import type { ToolRow } from "@/lib/admin/shape";

export type Metric = {
  value: number | null;
  previous: number | null;
  spark: number[];
};

export type Overview = {
  runs: Metric;
  visitors: Metric;
  success: Metric;
  p50: Metric;
  p95: Metric;
  mcpSessions: Metric;
  pageViews: Metric;
  series: { bucket: string; web: number; mcp: number; api: number }[];
  topTools: { slug: string; name: string; runs: number }[];
  bySource: { source: string; runs: number }[];
  byOutcome: { outcome: string; runs: number }[];
  countries: { country: string; name: string; runs: number }[];
  clients: { name: string; version: string; runs: number }[];
  referrers: { host: string; views: number }[];
  utms: { source: string; medium: string; campaign: string; views: number }[];
  devices: { device: string; views: number }[];
  searches: { query: string; count: number; zero: boolean }[];
  rolledSearches: number;
  errorRates: { slug: string; name: string; errors: number; runs: number; rate: number }[];
  durationSource: "percentile" | "histogram" | "none";
};

export type LiveEvent = {
  id: string;
  ts: string;
  slug: string;
  source: RunSource;
  outcome: RunOutcome;
  errorCode: string | null;
  durationMs: number | null;
  country: string | null;
  client: string | null;
  version: string | null;
  protocol: string | null;
  host: string | null;
};

export type McpReport = {
  sessions: Metric;
  calls: Metric;
  clients: { name: string; version: string; runs: number }[];
  protocols: { protocol: string; runs: number }[];
  hosts: { host: string; runs: number; sessions: number }[];
  mix: { slug: string; name: string; runs: number }[];
  rolled: number;
  series: { bucket: string; runs: number }[];
};

export type ErrorGroup = {
  slug: string;
  name: string;
  code: string;
  count: number;
  spark: number[];
};

export type ErrorReport = {
  groups: ErrorGroup[];
  series: { bucket: string; count: number }[];
};

export type ToolDetail = {
  tool: ToolRow;
  series: { bucket: string; web: number; mcp: number; api: number }[];
  errors: { code: string; count: number }[];
  clients: { name: string; version: string; runs: number }[];
  countries: { country: string; name: string; runs: number }[];
  sources: { source: string; runs: number }[];
  recent: LiveEvent[];
  durationSource: "percentile" | "histogram" | "none";
};

export type Load<T> = { ok: true; data: T } | { ok: false; error: "unavailable" | "timeout" | "failed" };

export type { ToolRow };
