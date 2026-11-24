import { z } from "zod";
import { outboundFetch } from "@/lib/net/outbound";
import type { BenchTool } from "@/lib/mcp/types";
import {
  CURRENCIES,
  convertAmount,
  fallbackUrl,
  historicalUrl,
  isCurrencyShape,
  isCurrencyCode,
  latestUrl,
  parseFallback,
  parseLatest,
} from "@/tools/currency-converter/lib/currency";

export const inputSchema = z.object({
  amount: z.number().positive().max(1e15).default(1),
  from: z.string().length(3).default("USD").describe("ISO 4217 currency code."),
  to: z.string().length(3).default("EUR").describe("ISO 4217 currency code."),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
    .optional()
    .describe("Historical date; omit for the latest rates."),
});

export const outputSchema = z.object({
  ok: z.boolean(),
  amount: z.number().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  rate: z.number().optional(),
  result: z.number().optional(),
  date: z.string().optional(),
  error: z.string().optional(),
  source: z.enum(["ecb", "fawazahmed0"]).optional().describe("ecb: European Central Bank via Frankfurter. fawazahmed0: wider daily rates for other codes."),
});

const ECB_CODES = CURRENCIES.map((currency) => currency.code).join(", ");

async function getJson(url: string) {
  const response = await outboundFetch(url, {
    method: "GET",
    timeoutMs: 10_000,
    maxBytes: 400_000,
    maxRedirects: 2,
    headers: { accept: "application/json" },
  });
  return { status: response.status, json: response.status < 400 ? (JSON.parse(new TextDecoder().decode(response.body)) as unknown) : null };
}

async function fromEcb(amount: number, from: string, to: string, date?: string) {
  const { status, json } = await getJson(date ? historicalUrl(date, from, [to]) : latestUrl(from, [to]));
  if (status >= 400) return outputSchema.parse({ ok: false, error: `Rates service returned ${status}.` });
  const latest = parseLatest(json);
  const rate = latest.rates[to];
  if (rate === undefined) return outputSchema.parse({ ok: false, error: `No rate for ${to} on ${latest.date}.` });
  return outputSchema.parse({ ok: true, amount, from, to, rate, result: convertAmount(amount, rate), date: latest.date, source: "ecb" });
}

async function fromFallback(amount: number, from: string, to: string, date?: string) {
  const { status, json } = await getJson(fallbackUrl(from, date));
  if (status === 404) {
    return outputSchema.parse({ ok: false, error: date ? `No rates for ${from} on ${date}.` : `Unknown currency: ${from}.` });
  }
  if (status >= 400) return outputSchema.parse({ ok: false, error: `Rates service returned ${status}.` });
  const found = parseFallback(json, from, to);
  if (found.rate === null) return outputSchema.parse({ ok: false, error: `Unknown currency: ${to}.` });
  return outputSchema.parse({ ok: true, amount, from, to, rate: found.rate, result: convertAmount(amount, found.rate), date: found.date, source: "fawazahmed0" });
}

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const from = parsed.from.toUpperCase();
  const to = parsed.to.toUpperCase();
  for (const code of [from, to]) {
    if (!isCurrencyShape(code)) return outputSchema.parse({ ok: false, error: `Unknown currency: ${code}. Use a 3-letter ISO 4217 code.` });
  }
  try {
    if (isCurrencyCode(from) && isCurrencyCode(to)) return await fromEcb(parsed.amount, from, to, parsed.date);
    return await fromFallback(parsed.amount, from, to, parsed.date);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The conversion failed.";
    return outputSchema.parse({ ok: false, error: message });
  }
}

export const tool: BenchTool = {
  slug: "currency-converter",
  name: "convert_currency",
  title: "Convert an amount between currencies",
  description:
    `Convert money between ISO 4217 currencies with daily exchange rates. ECB reference rates (via Frankfurter) are used for ${ECB_CODES}; other codes such as PKR, AED, SAR or NGN use the free fawazahmed0 currency API. The result says which source answered. Supports historical dates (YYYY-MM-DD).`,
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
