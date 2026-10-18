import type { AnalyticsEvent } from "@/lib/analytics/types";
import { safeError } from "@/lib/analytics/clean";

export type QueueOptions = {
  write: (events: AnalyticsEvent[]) => Promise<void>;
  max?: number;
  batch?: number;
  intervalMs?: number;
  warn?: (message: string) => void;
  enabled?: () => boolean;
};

export function createQueue(options: QueueOptions) {
  const max = options.max ?? 2000;
  const batch = options.batch ?? 50;
  const intervalMs = options.intervalMs ?? 3000;
  const warn = options.warn ?? ((message: string) => console.warn(`[analytics] ${message}`));
  const enabled = options.enabled ?? (() => true);
  const buffer: AnalyticsEvent[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  let flushing = false;
  let dropped = 0;

  function schedule() {
    if (timer || buffer.length === 0) return;
    timer = setTimeout(() => {
      timer = null;
      void flush();
    }, intervalMs);
    timer.unref?.();
  }

  async function flush() {
    if (flushing) return;
    flushing = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    try {
      while (buffer.length > 0) {
        const events = buffer.splice(0, 500);
        try {
          await options.write(events);
        } catch (error) {
          warn(`flush failed: ${safeError(error)}`);
        }
      }
    } finally {
      flushing = false;
      if (buffer.length > 0) schedule();
    }
  }

  return {
    push(event: AnalyticsEvent) {
      if (!enabled()) return;
      if (buffer.length >= max) {
        dropped += 1;
        if (dropped === 1 || dropped % 100 === 0) warn(`dropping events; buffer full (${max}), dropped ${dropped}`);
        return;
      }
      buffer.push(event);
      if (buffer.length >= batch) void flush();
      else schedule();
    },
    flush,
    size() {
      return buffer.length;
    },
    dropped() {
      return dropped;
    },
    clear() {
      buffer.length = 0;
      dropped = 0;
      if (timer) clearTimeout(timer);
      timer = null;
    },
  };
}

export function bindProcessFlush(flush: () => Promise<void>) {
  const onStop = () => {
    void flush().catch((error: unknown) => {
      console.warn("[analytics] shutdown flush failed", safeError(error));
    });
  };
  process.on("SIGTERM", onStop);
  process.on("SIGINT", onStop);
  return () => {
    process.off("SIGTERM", onStop);
    process.off("SIGINT", onStop);
  };
}
