import type { Reader, CountryResponse } from "mmdb-lib";
import type { AnalyticsEvent, AnalyticsStore } from "@/lib/analytics/types";

/**
 * Next's standalone server can evaluate instrumentation and route handlers as
 * separate copies of this module. Symbol.for is one object for the whole process.
 */
const KEY = Symbol.for("benchline.analytics");

export type AnalyticsQueue = {
  push(event: AnalyticsEvent): void;
  flush(): Promise<void>;
  size(): number;
  dropped(): number;
  clear(): void;
};

export type AnalyticsRuntime = {
  store: AnalyticsStore | null;
  sql: unknown;
  queue: AnalyticsQueue | null;
  ensure: (() => Promise<AnalyticsStore | null>) | null;
  stopSignals: (() => void) | null;
  retaining: boolean;
  boot: Promise<AnalyticsStore | null> | null;
  started: boolean;
  retainTimer: ReturnType<typeof setInterval> | null;
  reader: Reader<CountryResponse> | null;
  geoLoading: Promise<void> | null;
  loggedOn: boolean;
  loggedOff: boolean;
  warnedSalt: boolean;
  dropped: number;
  lastDropLog: number;
};

function emptyRuntime(): AnalyticsRuntime {
  return {
    store: null,
    sql: null,
    queue: null,
    ensure: null,
    stopSignals: null,
    retaining: false,
    boot: null,
    started: false,
    retainTimer: null,
    reader: null,
    geoLoading: null,
    loggedOn: false,
    loggedOff: false,
    warnedSalt: false,
    dropped: 0,
    lastDropLog: 0,
  };
}

export function analyticsRuntime(): AnalyticsRuntime {
  const g = globalThis as typeof globalThis & { [KEY]?: AnalyticsRuntime };
  if (!g[KEY]) g[KEY] = emptyRuntime();
  return g[KEY];
}
