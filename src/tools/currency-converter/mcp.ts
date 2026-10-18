import { z } from "zod";
import { outboundFetch } from "@/lib/net/outbound";
import type { BenchTool } from "@/lib/mcp/types";
import {
  convertAmount,
  historicalUrl,
  isCurrencyCode,
  latestUrl,
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
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const from = parsed.from.toUpperCase();
  const to = parsed.to.toUpperCase();
  if (!isCurrencyCode(from)) return outputSchema.parse({ ok: false, error: `Unknown currency: ${from}.` });
  if (!isCurrencyCode(to)) return outputSchema.parse({ ok: false, error: `Unknown currency: ${to}.` });
  try {
    const url = parsed.date ? historicalUrl(parsed.date, from, [to]) : latestUrl(from, [to]);
    const response = await outboundFetch(url, {
      method: "GET",
      timeoutMs: 10_000,
      maxBytes: 200_000,
      maxRedirects: 2,
      headers: { accept: "application/json" },
    });
    if (response.status >= 400) {
      return outputSchema.parse({ ok: false, error: `Rates service returned ${response.status}.` });
    }
    const json = JSON.parse(new TextDecoder().decode(response.body)) as unknown;
    const latest = parseLatest(json);
    const rate = latest.rates[to];
    if (rate === undefined) {
      return outputSchema.parse({ ok: false, error: `No rate for ${to} on ${latest.date}.` });
    }
    return outputSchema.parse({
      ok: true,
      amount: parsed.amount,
      from,
      to,
      rate,
      result: convertAmount(parsed.amount, rate),
      date: latest.date,
    });
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
    "Convert money between ISO 4217 currencies using live exchange rates from the Frankfurter API, fetched through the SSRF-safe outbound guard. Supports historical dates.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
