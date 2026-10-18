import { z } from "zod";
import { compareText, diffModes } from "@/tools/diff-checker/lib/diff";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  left: z.string().describe("The original text."),
  right: z.string().describe("The changed text."),
  mode: z.enum(diffModes).default("line"),
  ignoreWhitespace: z.boolean().default(false),
});

const piece = z.object({ type: z.enum(["same", "add", "remove"]), value: z.string() });
const row = z.object({
  kind: z.enum(["same", "add", "remove", "change"]),
  left: z.string(),
  right: z.string(),
  leftNumber: z.number().int().nullable(),
  rightNumber: z.number().int().nullable(),
});

export const outputSchema = z.object({
  ok: z.boolean(),
  error: z.string(),
  unchanged: z.boolean(),
  added: z.number().int(),
  removed: z.number().int(),
  unit: z.enum(["lines", "characters"]),
  patch: z.string(),
  pieces: z.array(piece),
  rows: z.array(row),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const result = compareText(parsed.left, parsed.right, parsed.mode, parsed.ignoreWhitespace);
  return outputSchema.parse(result);
}

export const tool: BenchTool = {
  slug: "diff-checker",
  name: "diff_text",
  title: "Diff two texts",
  description: "Compare two texts by line, word, or character, or compare JSON so object key order does not matter. Returns an inline diff, side-by-side rows for line and JSON modes, and a unified patch.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
