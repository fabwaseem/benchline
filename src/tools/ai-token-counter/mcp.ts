import { z } from "zod";
import { priceSelected } from "@/tools/ai-token-counter/lib/cost";
import { DEFAULT_MODEL_IDS, MODELS } from "@/tools/ai-token-counter/lib/prices";
import { countTokens, type EncodingName } from "@/tools/ai-token-counter/lib/tokenize";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  text: z.string().describe("The prompt or document to count."),
  encoding: z.enum(["o200k", "cl100k"]).default("o200k"),
  modelIds: z.array(z.string()).default(DEFAULT_MODEL_IDS).describe("Price rows to return. Unknown ids are rejected."),
  outputTokens: z.number().int().min(0).default(0),
  cachedRatio: z.number().min(0).max(1).default(0),
  requestsPerDay: z.number().min(0).default(0),
});

export const outputSchema = z.object({
  count: z.number(),
  chars: z.number(),
  words: z.number(),
  encoding: z.string(),
  prices: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      inputUsd: z.number(),
      outputUsd: z.number(),
      requestUsd: z.number(),
      monthUsd: z.number(),
    }),
  ),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const known = new Set(MODELS.map((model) => model.id));
  const missing = parsed.modelIds.filter((id) => !known.has(id));
  if (missing.length > 0) throw new Error(`Unknown model id: ${missing.join(", ")}.`);
  const counted = countTokens(parsed.text, parsed.encoding as EncodingName, 0);
  const prices = priceSelected({
    ids: parsed.modelIds,
    inputTokens: counted.count,
    outputTokens: parsed.outputTokens,
    cachedRatio: parsed.cachedRatio,
    requestsPerDay: parsed.requestsPerDay,
  }).map((row) => ({
    id: row.model.id,
    label: row.model.label,
    inputUsd: row.inputUsd,
    outputUsd: row.outputUsd,
    requestUsd: row.requestUsd,
    monthUsd: row.monthUsd,
  }));
  return outputSchema.parse({
    count: counted.count,
    chars: counted.chars,
    words: counted.words,
    encoding: parsed.encoding,
    prices,
  });
}

export const tool: BenchTool = {
  slug: "ai-token-counter",
  name: "count_tokens",
  title: "Count tokens",
  description: "Count tokens with the o200k or cl100k encoder and price the count against the published model table. Claude and Gemini rows are estimates, not those vendors' tokenizers.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
