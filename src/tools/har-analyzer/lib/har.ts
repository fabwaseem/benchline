// Pure HAR (HTTP Archive) analysis. No I/O here; the UI reads the file and
// passes its text in.

export const HAR_MAX_ENTRIES = 2000;

export type HarTimings = {
  blocked: number;
  dns: number;
  connect: number;
  send: number;
  wait: number;
  receive: number;
};

export type HarEntry = {
  index: number;
  method: string;
  url: string;
  host: string;
  status: number;
  statusText: string;
  mimeType: string;
  timeMs: number;
  sizeBytes: number;
  timings: HarTimings;
  startedAt: string;
};

export type HarSummary = {
  totalRequests: number;
  totalTimeMs: number;
  totalBytes: number;
  truncated: boolean;
  statusGroups: { "2xx": number; "3xx": number; "4xx": number; "5xx": number; other: number };
  slowest: HarEntry[];
  largest: HarEntry[];
  topHosts: Array<{ host: string; requests: number; bytes: number }>;
};

export type HarAnalysis = { entries: HarEntry[]; summary: HarSummary } | { error: string };

const TIMING_KEYS = ["blocked", "dns", "connect", "send", "wait", "receive"] as const;

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function textOr(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function timingsOf(raw: unknown): HarTimings {
  const source = (raw ?? {}) as Record<string, unknown>;
  const timings = {} as HarTimings;
  for (const key of TIMING_KEYS) {
    const value = numberOr(source[key], 0);
    timings[key] = value < 0 ? 0 : Math.round(value * 10) / 10;
  }
  return timings;
}

function sizeOf(response: Record<string, unknown>): number {
  const content = (response.content ?? {}) as Record<string, unknown>;
  const contentSize = numberOr(content.size, -1);
  if (contentSize >= 0) return Math.round(contentSize);
  const bodySize = numberOr(response.bodySize, -1);
  return bodySize >= 0 ? Math.round(bodySize) : 0;
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

function entryOf(raw: unknown, index: number): HarEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const request = (record.request ?? {}) as Record<string, unknown>;
  const response = (record.response ?? {}) as Record<string, unknown>;
  const url = textOr(request.url, "");
  if (!url) return null;
  const status = Math.round(numberOr(response.status, 0));
  return {
    index,
    method: textOr(request.method, "?").toUpperCase(),
    url,
    host: hostOf(url),
    status,
    statusText: textOr(response.statusText, ""),
    mimeType: textOr((response.content as Record<string, unknown> | undefined)?.mimeType, ""),
    timeMs: Math.round(numberOr(record.time, 0) * 10) / 10,
    sizeBytes: sizeOf(response),
    timings: timingsOf(record.timings),
    startedAt: textOr(record.startedDateTime, ""),
  };
}

function groupOf(status: number): keyof HarSummary["statusGroups"] {
  if (status >= 200 && status < 300) return "2xx";
  if (status >= 300 && status < 400) return "3xx";
  if (status >= 400 && status < 500) return "4xx";
  if (status >= 500 && status < 600) return "5xx";
  return "other";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 100 ? Math.round(value) : Math.round(value * 10) / 10} ${units[unit]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${Math.round((ms / 1000) * 10) / 10} s`;
}

export function analyzeHarText(text: string, top: number = 5): HarAnalysis {
  if (!text.trim()) return { error: "Paste HAR JSON or drop a .har file." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON.";
    return { error: `That is not valid JSON: ${message}` };
  }
  const log = (parsed as { log?: unknown } | null)?.log as { entries?: unknown } | undefined;
  if (!log || !Array.isArray(log.entries)) {
    return { error: "That is not a HAR file: expected a top-level log.entries array." };
  }
  const truncated = log.entries.length > HAR_MAX_ENTRIES;
  const entries: HarEntry[] = [];
  for (const [index, raw] of log.entries.slice(0, HAR_MAX_ENTRIES).entries()) {
    const entry = entryOf(raw, index);
    if (entry) entries.push(entry);
  }
  if (entries.length === 0) return { error: "The HAR file has no usable entries." };

  const statusGroups: HarSummary["statusGroups"] = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0, other: 0 };
  const byHost = new Map<string, { requests: number; bytes: number }>();
  let totalTimeMs = 0;
  let totalBytes = 0;
  for (const entry of entries) {
    statusGroups[groupOf(entry.status)] += 1;
    totalTimeMs += entry.timeMs;
    totalBytes += entry.sizeBytes;
    const host = entry.host || "(unknown)";
    const row = byHost.get(host) ?? { requests: 0, bytes: 0 };
    row.requests += 1;
    row.bytes += entry.sizeBytes;
    byHost.set(host, row);
  }

  const slowest = [...entries].sort((a, b) => b.timeMs - a.timeMs).slice(0, top);
  const largest = [...entries].sort((a, b) => b.sizeBytes - a.sizeBytes).slice(0, top);
  const topHosts = [...byHost.entries()]
    .map(([host, stats]) => ({ host, ...stats }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, top);

  return {
    entries,
    summary: {
      totalRequests: entries.length,
      totalTimeMs: Math.round(totalTimeMs),
      totalBytes,
      truncated,
      statusGroups,
      slowest,
      largest,
      topHosts,
    },
  };
}
