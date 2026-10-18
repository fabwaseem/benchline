import { safeError } from "@/lib/analytics/clean";
import { createPostgresStore, openDatabase, type Sql } from "@/lib/analytics/db";
import { retentionDays } from "@/lib/analytics/duration";
import { ensureGeoDb } from "@/lib/analytics/geodb";
import { analyticsRuntime } from "@/lib/analytics/global";
import { bindProcessFlush, createQueue } from "@/lib/analytics/queue";
import type { AnalyticsEvent, AnalyticsStore } from "@/lib/analytics/types";

const DROP_LOG_MS = 60_000;

function queue() {
  const slot = analyticsRuntime();
  if (!slot.queue) {
    slot.queue = createQueue({
      enabled: () => analyticsRuntime().store !== null || Boolean(process.env.DATABASE_URL),
      write: async (events) => {
        const ensure = analyticsRuntime().ensure;
        const current = ensure ? await ensure() : analyticsRuntime().store;
        if (!current) {
          noteDrop(events.length);
          return;
        }
        await current.write(events);
      },
    });
  }
  return slot.queue;
}

function noteDrop(count: number) {
  if (!process.env.DATABASE_URL || count <= 0) return;
  const slot = analyticsRuntime();
  slot.dropped += count;
  const now = Date.now();
  if (slot.lastDropLog !== 0 && now - slot.lastDropLog < DROP_LOG_MS) return;
  slot.lastDropLog = now;
  console.warn(`[analytics] dropping events; no store while DATABASE_URL is set (dropped ${slot.dropped})`);
}

function logOff() {
  const slot = analyticsRuntime();
  if (slot.loggedOff) return;
  slot.loggedOff = true;
  console.info("[analytics] DATABASE_URL is unset; usage tracking is off");
}

async function retainSafely() {
  const slot = analyticsRuntime();
  if (!slot.store || slot.retaining) return;
  slot.retaining = true;
  try {
    await slot.store.retain(retentionDays());
  } catch (error) {
    console.warn("[analytics] retention failed", safeError(error));
  } finally {
    analyticsRuntime().retaining = false;
  }
}

function scheduleRetention() {
  const slot = analyticsRuntime();
  if (slot.retainTimer) return;
  void retainSafely();
  const timer = setInterval(() => {
    void retainSafely();
  }, 24 * 60 * 60 * 1000);
  timer.unref?.();
  slot.retainTimer = timer;
}

export function installShutdownFlush() {
  const slot = analyticsRuntime();
  if (slot.stopSignals) return;
  slot.stopSignals = bindProcessFlush(async () => {
    await queue().flush();
    const sql = analyticsRuntime().sql as { end?: (options: { timeout: number }) => Promise<void> } | null;
    try {
      await sql?.end?.({ timeout: 2 });
    } catch (error) {
      console.warn("[analytics] shutdown flush failed", safeError(error));
    }
  });
}

async function runBoot(url: string): Promise<AnalyticsStore | null> {
  const slot = analyticsRuntime();
  try {
    if (!process.env.ANALYTICS_SALT && !slot.warnedSalt) {
      slot.warnedSalt = true;
      console.warn("[analytics] ANALYTICS_SALT is unset; IP hashes will be omitted");
    }
    void ensureGeoDb();
    if (!slot.sql) slot.sql = openDatabase(url);
    const store = createPostgresStore(slot.sql as Sql);
    await store.migrate();
    slot.store = store;
    installShutdownFlush();
    scheduleRetention();
    if (!slot.loggedOn) {
      slot.loggedOn = true;
      console.info("[analytics] usage tracking is on");
    }
    await queue().flush();
    return store;
  } catch (error) {
    console.warn("[analytics] database unavailable", safeError(error));
    return null;
  }
}

/** Open Postgres on first use. Concurrent callers share one migration. */
export function ensureAnalyticsStore(): Promise<AnalyticsStore | null> {
  const slot = analyticsRuntime();
  if (slot.store) return Promise.resolve(slot.store);
  const url = process.env.DATABASE_URL;
  if (!url) {
    logOff();
    return Promise.resolve(null);
  }
  if (!slot.boot) {
    slot.boot = runBoot(url).finally(() => {
      const current = analyticsRuntime();
      if (!current.store) current.boot = null;
    });
  }
  return slot.boot;
}

analyticsRuntime().ensure = ensureAnalyticsStore;

export function setAnalyticsStore(next: AnalyticsStore | null) {
  analyticsRuntime().store = next;
}

export function getAnalyticsStore(): Promise<AnalyticsStore | null> {
  return ensureAnalyticsStore();
}

export function analyticsEnabled(): boolean {
  return analyticsRuntime().store !== null;
}

export function enqueue(event: AnalyticsEvent) {
  try {
    const slot = analyticsRuntime();
    if (!slot.store && !process.env.DATABASE_URL) return;
    queue().push(event);
    if (!slot.store) void ensureAnalyticsStore();
  } catch (error) {
    console.warn("[analytics] enqueue failed", safeError(error));
  }
}

export async function flushAnalytics() {
  await queue().flush();
}

export function resetAnalyticsForTests() {
  const slot = analyticsRuntime();
  slot.store = null;
  slot.boot = null;
  slot.sql = null;
  slot.queue?.clear();
  slot.stopSignals?.();
  slot.stopSignals = null;
  if (slot.retainTimer) clearInterval(slot.retainTimer);
  slot.retainTimer = null;
  slot.retaining = false;
  slot.started = false;
  slot.loggedOn = false;
  slot.loggedOff = false;
  slot.warnedSalt = false;
  slot.dropped = 0;
  slot.lastDropLog = 0;
  slot.ensure = ensureAnalyticsStore;
}
