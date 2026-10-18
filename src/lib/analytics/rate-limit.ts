export type RateResult = { ok: true } | { ok: false; retryAfter: number };

export function createRateLimit(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return {
    check(key: string, now = Date.now()): RateResult {
      const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
      if (recent.length >= limit) {
        const retryAfter = Math.max(1, Math.ceil((recent[0]! + windowMs - now) / 1000));
        hits.set(key, recent);
        return { ok: false, retryAfter };
      }
      recent.push(now);
      hits.set(key, recent);
      if (hits.size > 10_000) {
        const oldest = hits.keys().next().value;
        if (oldest) hits.delete(oldest);
      }
      return { ok: true };
    },
    reset() {
      hits.clear();
    },
  };
}

const trackLimit = createRateLimit(30, 60_000);

export function trackRateLimit(key: string, now = Date.now()): RateResult {
  return trackLimit.check(key, now);
}

export function resetTrackRateLimit() {
  trackLimit.reset();
}
