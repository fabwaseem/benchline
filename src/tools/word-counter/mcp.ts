import { z } from "zod";
import { countText } from "@/tools/word-counter/lib/count";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  text: z.string().max(200_000).describe("Text to count."),
});

export const outputSchema = z.object({
  words: z.number().int(),
  uniqueWords: z.number().int(),
  characters: z.number().int(),
  charactersNoSpaces: z.number().int(),
  graphemes: z.number().int(),
  sentences: z.number().int(),
  paragraphs: z.number().int(),
  lines: z.number().int(),
  readingLabel: z.string(),
  speakingLabel: z.string(),
  platforms: z.array(z.object({
    id: z.string(),
    label: z.string(),
    limit: z.number().int(),
    count: z.number().int(),
    over: z.boolean(),
  })),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const counts = countText(parsed.text);
  return outputSchema.parse(counts);
}

export const tool: BenchTool = {
  slug: "word-counter",
  name: "count_text",
  title: "Count words and characters",
  description: "Count words, code points, graphemes, sentences, and paragraphs, and compare the length with SEO and social limits.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
