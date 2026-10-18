export const DURATION_EDGES = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000] as const;

export function durationBucket(ms: number): number {
  const index = DURATION_EDGES.findIndex((edge) => ms <= edge);
  return index === -1 ? DURATION_EDGES.length : index;
}

export function emptyHistogram(): number[] {
  return Array.from({ length: DURATION_EDGES.length + 1 }, () => 0);
}

export function addDuration(hist: number[], ms: number | null) {
  if (ms === null || !Number.isFinite(ms) || ms < 0) return;
  const index = durationBucket(ms);
  hist[index] = (hist[index] ?? 0) + 1;
}

export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (sorted.length - 1) * p;
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  const lowValue = sorted[low] ?? sorted[0]!;
  const highValue = sorted[high] ?? lowValue;
  if (low === high) return Math.round(lowValue);
  return Math.round(lowValue + (highValue - lowValue) * (rank - low));
}

export function percentileFromHist(hist: number[], p: number): number | null {
  const total = hist.reduce((sum, count) => sum + count, 0);
  if (total <= 0) return null;
  const target = Math.max(1, Math.ceil(total * p));
  let seen = 0;
  for (let index = 0; index < hist.length; index += 1) {
    seen += hist[index] ?? 0;
    if (seen >= target) return DURATION_EDGES[index] ?? DURATION_EDGES[DURATION_EDGES.length - 1] ?? null;
  }
  return DURATION_EDGES[DURATION_EDGES.length - 1] ?? null;
}

export function retentionCutoff(days: number, now = new Date()): Date {
  const safe = Number.isFinite(days) ? Math.min(3650, Math.max(1, Math.floor(days))) : 90;
  const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return new Date(midnight - safe * 86_400_000);
}

export function retentionDays(value = process.env.ANALYTICS_RETENTION_DAYS): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 90;
  return Math.min(3650, Math.max(1, Math.floor(parsed)));
}
