export function formatNumber(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en", { notation: Math.abs(value) >= 10_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

export function formatPercent(rate: number | null): string {
  if (rate === null || !Number.isFinite(rate)) return "—";
  return `${new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(rate * 100)}%`;
}

export function formatDelta(delta: number | null): string {
  if (delta === null) return "New";
  const pct = Math.round(delta * 1000) / 10;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(pct)}%`;
}

export function formatMs(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  if (value >= 1000) return `${new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(value / 1000)}s`;
  return `${Math.round(value)}ms`;
}

export function formatWhen(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "UTC",
  }).format(date);
}

export function bucketLabel(bucket: string): string {
  if (bucket.includes("T")) return bucket.slice(11, 16);
  return bucket.slice(5);
}
