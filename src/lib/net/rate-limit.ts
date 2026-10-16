const hits = new Map<string, number[]>();

export function rateLimit(
  key: string,
  limit = 8,
  windowMs = 10 * 60 * 1000,
  now = Date.now(),
): { ok: true } | { ok: false; retryAfter: number } {
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) {
    const retryAfter = Math.max(1, Math.ceil((recent[0]! + windowMs - now) / 1000));
    hits.set(key, recent);
    return { ok: false, retryAfter };
  }
  recent.push(now);
  hits.set(key, recent);
  return { ok: true };
}

export function resetRateLimit() {
  hits.clear();
}
