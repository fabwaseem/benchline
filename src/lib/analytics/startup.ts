import { retentionDays } from "@/lib/analytics/duration";
import { createPostgresStore, openDatabase } from "@/lib/analytics/db";
import { ensureGeoDb } from "@/lib/analytics/geodb";
import { safeError } from "@/lib/analytics/clean";
import { flushAnalytics, getAnalyticsStore, installShutdownFlush, setAnalyticsStore } from "@/lib/analytics/store";

const g = globalThis as { __benchlineAnalytics?: boolean };
let sql: ReturnType<typeof openDatabase> | null = null;
let retaining = false;

async function retainSafely() {
  const store = getAnalyticsStore();
  if (!store || retaining) return;
  retaining = true;
  try {
    await store.retain(retentionDays());
  } catch (error) {
    console.warn("[analytics] retention failed", safeError(error));
  } finally {
    retaining = false;
  }
}

async function boot() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.info("[analytics] DATABASE_URL is unset; usage tracking is off");
    return;
  }
  if (!process.env.ANALYTICS_SALT) console.warn("[analytics] ANALYTICS_SALT is unset; IP hashes will be omitted");
  sql = openDatabase(url);
  const store = createPostgresStore(sql);
  await store.migrate();
  setAnalyticsStore(store);
  installShutdownFlush();
  void retainSafely();
  const timer = setInterval(() => {
    void retainSafely();
  }, 24 * 60 * 60 * 1000);
  timer.unref?.();
  const onStop = () => {
    void flushAnalytics().finally(() => {
      void sql?.end({ timeout: 2 });
    });
  };
  process.once("SIGTERM", onStop);
  process.once("SIGINT", onStop);
}

export async function startAnalytics() {
  if (g.__benchlineAnalytics) return;
  g.__benchlineAnalytics = true;
  await Promise.race([
    ensureGeoDb(),
    new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 2000);
      timer.unref?.();
    }),
  ]);
  if (!process.env.DATABASE_URL) {
    console.info("[analytics] DATABASE_URL is unset; usage tracking is off");
    return;
  }
  try {
    await Promise.race([
      boot(),
      new Promise<never>((_, reject) => {
        const timer = setTimeout(() => reject(new Error("startup timeout")), 8000);
        timer.unref?.();
      }),
    ]);
  } catch (error) {
    console.warn("[analytics] disabled", safeError(error));
    setAnalyticsStore(null);
  }
}
