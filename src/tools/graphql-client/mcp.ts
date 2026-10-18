import { z } from "zod";
import { executeGraphql } from "@/tools/graphql-client/lib/graphql";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  endpoint: z.string().url().max(2000),
  query: z.string().min(1).max(50_000),
  variables: z.record(z.string(), z.unknown()).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  timeoutMs: z.number().int().min(1000).max(60000).default(15000),
});

export const outputSchema = z.object({
  ok: z.boolean(),
  status: z.number().int(),
  durationMs: z.number(),
  data: z.unknown().optional(),
  errors: z.unknown().optional(),
  error: z.string().optional(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const result = await executeGraphql({
    endpoint: parsed.endpoint,
    query: parsed.query,
    variablesText: parsed.variables ? JSON.stringify(parsed.variables) : "",
    headers: Object.entries(parsed.headers ?? {}).map(([name, value]) => ({ name, value })),
    timeoutMs: parsed.timeoutMs,
  });
  return outputSchema.parse(result);
}

export const tool: BenchTool = {
  slug: "graphql-client",
  name: "execute_graphql",
  title: "Execute a GraphQL query",
  description:
    "Send a GraphQL query with optional variables and headers to an endpoint and return the response data or errors.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
