import { z } from "zod";
import { evaluateJsonPath, JSONPATH_MAX_MATCHES } from "@/tools/jsonpath-tester/lib/jsonpath";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  json: z.string().min(1).describe("JSON document text"),
  query: z.string().min(1).describe("JSONPath query, e.g. $.store.book[*].author"),
  limit: z.number().int().min(1).max(JSONPATH_MAX_MATCHES).default(50).describe("Maximum matches to return"),
});

export const outputSchema = z.object({
  count: z.number().int(),
  truncated: z.boolean(),
  matches: z.array(
    z.object({
      path: z.string(),
      value: z.unknown(),
    }),
  ),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const result = evaluateJsonPath(parsed.json, parsed.query, parsed.limit);
  if ("error" in result) throw new Error(result.error);
  return outputSchema.parse(result);
}

export const tool: BenchTool = {
  slug: "jsonpath-tester",
  name: "query_jsonpath",
  title: "Run a JSONPath query",
  description: "Evaluate a JSONPath Plus query against a JSON document and return the matches with their paths.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
