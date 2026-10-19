import { ensureGeoDb } from "@/lib/analytics/geodb";
import { analyticsRuntime } from "@/lib/analytics/global";
import { safeError } from "@/lib/analytics/clean";
import { ensureAnalyticsStore, installShutdownFlush } from "@/lib/analytics/store";

function delay(ms: number, rejectOnTimeout: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (rejectOnTimeout) reject(new Error("startup timeout"));
      else resolve();
    }, ms);
    timer.unref?.();
  });
}

export async function startAnalytics() {
  const slot = analyticsRuntime();
  if (slot.started) return;
  slot.started = true;
  installShutdownFlush();
  console.info("[analytics] starting");
  await Promise.race([ensureGeoDb(), delay(2000, false)]);
  if (!process.env.DATABASE_URL) {
    await ensureAnalyticsStore();
    return;
  }
  try {
    await Promise.race([ensureAnalyticsStore(), delay(8000, true)]);
  } catch (error) {
    console.warn("[analytics] startup still connecting", safeError(error));
  }
}
