export type Currency = { code: string; name: string; symbol: string };

export const CURRENCIES: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr" },
  { code: "CAD", name: "Canadian Dollar", symbol: "$" },
  { code: "AUD", name: "Australian Dollar", symbol: "$" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft" },
  { code: "ILS", name: "Israeli New Shekel", symbol: "₪" },
  { code: "ISK", name: "Icelandic Króna", symbol: "kr" },
  { code: "RON", name: "Romanian Leu", symbol: "lei" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "MXN", name: "Mexican Peso", symbol: "$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "$" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "$" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł" },
];

const CURRENCY_CODES = new Set(CURRENCIES.map((currency) => currency.code));

export function isCurrencyCode(code: string): boolean {
  return CURRENCY_CODES.has(code.toUpperCase());
}

export function currencyLabel(code: string): string {
  const found = CURRENCIES.find((currency) => currency.code === code.toUpperCase());
  return found ? `${found.code} — ${found.name}` : code.toUpperCase();
}

const FRANKFURTER = "https://api.frankfurter.dev/v1";

export function latestUrl(base: string, symbols: string[]): string {
  const params = new URLSearchParams({ base: base.toUpperCase() });
  if (symbols.length > 0) params.set("symbols", symbols.map((symbol) => symbol.toUpperCase()).join(","));
  return `${FRANKFURTER}/latest?${params.toString()}`;
}

export function historicalUrl(date: string, base: string, symbols: string[]): string {
  const params = new URLSearchParams({ base: base.toUpperCase() });
  if (symbols.length > 0) params.set("symbols", symbols.map((symbol) => symbol.toUpperCase()).join(","));
  return `${FRANKFURTER}/${date}?${params.toString()}`;
}

export function timeSeriesUrl(start: string, end: string, base: string, symbol: string): string {
  const params = new URLSearchParams({ base: base.toUpperCase(), symbols: symbol.toUpperCase() });
  return `${FRANKFURTER}/${start}..${end}?${params.toString()}`;
}

export type LatestRates = { base: string; date: string; rates: Record<string, number> };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseLatest(json: unknown): LatestRates {
  if (!isRecord(json)) throw new Error("Unexpected rates response.");
  const { base, date, rates } = json;
  if (typeof base !== "string" || typeof date !== "string" || !isRecord(rates)) {
    throw new Error("Unexpected rates response.");
  }
  const parsed: Record<string, number> = {};
  for (const [code, rate] of Object.entries(rates)) {
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
      throw new Error(`Bad rate for ${code}.`);
    }
    parsed[code.toUpperCase()] = rate;
  }
  return { base: base.toUpperCase(), date, rates: parsed };
}

export type RatePoint = { date: string; rate: number };

export function parseTimeSeries(json: unknown, symbol: string): RatePoint[] {
  if (!isRecord(json)) throw new Error("Unexpected time series response.");
  const { rates } = json;
  if (!isRecord(rates)) throw new Error("Unexpected time series response.");
  const upper = symbol.toUpperCase();
  const points: RatePoint[] = [];
  for (const [date, entry] of Object.entries(rates)) {
    if (!isRecord(entry)) continue;
    const rate = entry[upper];
    if (typeof rate === "number" && Number.isFinite(rate) && rate > 0) {
      points.push({ date, rate });
    }
  }
  points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return points;
}

export function convertAmount(amount: number, rate: number): number {
  return amount * rate;
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency.toUpperCase()}`;
  }
}

export function parseAmountInput(text: string): { ok: true; value: number } | { ok: false; error: string } {
  const cleaned = text.replace(/,/g, "").trim();
  if (cleaned.length === 0) return { ok: false, error: "Enter an amount." };
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return { ok: false, error: "That is not a number." };
  if (value < 0) return { ok: false, error: "The amount cannot be negative." };
  if (value > 1e15) return { ok: false, error: "That amount is too large." };
  return { ok: true, value };
}

export function trendStats(points: RatePoint[]): { min: number; max: number; first: number; last: number; changePct: number } | null {
  if (points.length === 0) return null;
  const first = points[0]?.rate ?? 0;
  const last = points[points.length - 1]?.rate ?? 0;
  let min = first;
  let max = first;
  for (const point of points) {
    if (point.rate < min) min = point.rate;
    if (point.rate > max) max = point.rate;
  }
  return { min, max, first, last, changePct: first === 0 ? 0 : ((last - first) / first) * 100 };
}

export function isoDateDaysAgo(days: number, now: Date = new Date()): string {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}
