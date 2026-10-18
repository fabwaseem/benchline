import { z } from "zod";
import { testRegex } from "@/tools/regex-tester/lib/regex";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  pattern: z.string().describe("JavaScript regular expression body, without slashes."),
  flags: z.string().default(""),
  text: z.string().describe("Sample to search."),
  replacement: z.string().optional().describe("When set, the sample is replaced and returned."),
});

export const outputSchema = z.object({
  matches: z.array(z.object({
    index: z.number().int(),
    length: z.number().int(),
    value: z.string(),
    groups: z.array(z.object({ name: z.string(), value: z.string() })),
  })),
  truncated: z.boolean(),
  explanation: z.array(z.string()),
  replacement: z.string().nullable(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const result = testRegex(parsed.pattern, parsed.flags, parsed.text, parsed.replacement);
  if (!result.valid) throw new Error(result.error);
  return outputSchema.parse({
    matches: result.matches,
    truncated: result.truncated,
    explanation: result.explanation,
    replacement: result.replacement,
  });
}

export const tool: BenchTool = {
  slug: "regex-tester",
  name: "test_regex",
  title: "Test a JavaScript regular expression",
  description: "Run a JavaScript regular expression against a sample and return every match, capture group, a short explanation, and an optional replacement.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
