import { safeError } from "@/lib/analytics/clean";
import { bindProcessFlush, createQueue } from "@/lib/analytics/queue";
import type { AnalyticsEvent, AnalyticsStore } from "@/lib/analytics/types";

let store: AnalyticsStore | null = null;
let stopSignals: (() => void) | null = null;

const queue = createQueue({
  enabled: () => store !== null,
  write: async (events) => {
    const current = store;
    if (!current) return;
    await current.write(events);
  },
});

export function setAnalyticsStore(next: AnalyticsStore | null) {
  store = next;
}

export function getAnalyticsStore(): AnalyticsStore | null {
  return store;
}

export function analyticsEnabled(): boolean {
  return store !== null;
}

export function enqueue(event: AnalyticsEvent) {
  try {
    queue.push(event);
  } catch (error) {
    console.warn("[analytics] enqueue failed", safeError(error));
  }
}

export async function flushAnalytics() {
  await queue.flush();
}

export function installShutdownFlush() {
  if (stopSignals) return;
  stopSignals = bindProcessFlush(() => queue.flush());
}

export function resetAnalyticsForTests() {
  store = null;
  queue.clear();
  stopSignals?.();
  stopSignals = null;
}
