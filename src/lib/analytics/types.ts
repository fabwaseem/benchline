export const RUN_SOURCES = ["mcp", "api", "web"] as const;
export const RUN_OUTCOMES = ["ok", "error", "rejected"] as const;
export const DEVICE_CLASSES = ["mobile", "tablet", "desktop"] as const;
export const UI_ACTIONS = ["copy", "download"] as const;

export type RunSource = (typeof RUN_SOURCES)[number];
export type RunOutcome = (typeof RUN_OUTCOMES)[number];
export type DeviceClass = (typeof DEVICE_CLASSES)[number];
export type UiAction = (typeof UI_ACTIONS)[number];
export type McpHost = "benchline" | "legacy";

export type ToolRunEvent = {
  kind: "run";
  ts: string;
  slug: string;
  source: RunSource;
  outcome: RunOutcome;
  errorCode: string | null;
  durationMs: number | null;
  inputBytes: number | null;
  outputBytes: number | null;
  ipHash: string | null;
  country: string | null;
  uaFamily: string | null;
  referrerHost: string | null;
  visitorId: string | null;
  sessionId: string | null;
  mcpSessionId: string | null;
  mcpClientName: string | null;
  mcpClientVersion: string | null;
  mcpProtocol: string | null;
  mcpHost: McpHost | null;
};

export type PageViewEvent = {
  kind: "page";
  ts: string;
  path: string;
  referrerHost: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  deviceClass: DeviceClass | null;
  ipHash: string | null;
  country: string | null;
  uaFamily: string | null;
  visitorId: string | null;
  sessionId: string | null;
};

export type ToolOpenEvent = {
  kind: "tool_open";
  ts: string;
  slug: string;
  referrerHost: string | null;
  deviceClass: DeviceClass | null;
  ipHash: string | null;
  country: string | null;
  uaFamily: string | null;
  visitorId: string | null;
  sessionId: string | null;
};

export type SearchEvent = {
  kind: "search";
  ts: string;
  query: string;
  ipHash: string | null;
  country: string | null;
  uaFamily: string | null;
  visitorId: string | null;
  sessionId: string | null;
};

export type ActionEvent = {
  kind: "action";
  ts: string;
  action: UiAction;
  slug: string | null;
  ipHash: string | null;
  country: string | null;
  uaFamily: string | null;
  visitorId: string | null;
  sessionId: string | null;
};

export type AnalyticsEvent = ToolRunEvent | PageViewEvent | ToolOpenEvent | SearchEvent | ActionEvent;

export type StatsFilter = {
  from: Date;
  to: Date;
  slug: string | null;
  source: RunSource | null;
};

export type StatsReport = {
  from: string;
  to: string;
  slug: string | null;
  source: RunSource | null;
  runs: number;
  byTool: { slug: string; runs: number; ok: number; error: number; rejected: number }[];
  bySource: { source: RunSource; runs: number }[];
  byOutcome: { outcome: RunOutcome; runs: number }[];
  byDay: { day: string; runs: number; ok: number; error: number; rejected: number }[];
  errorRate: number;
  rejectedRate: number;
  duration: { p50: number | null; p95: number | null; samples: number; source: "raw" | "histogram" | "none" };
  topMcpClients: { name: string; version: string | null; runs: number }[];
  topCountries: { country: string; runs: number }[];
  pages: { views: number; toolOpens: number; searches: number; copies: number; downloads: number };
};

export type AnalyticsStore = {
  write(events: AnalyticsEvent[]): Promise<void>;
  stats(filter: StatsFilter): Promise<StatsReport>;
  retain(days: number, now?: Date): Promise<void>;
  migrate(): Promise<void>;
};
