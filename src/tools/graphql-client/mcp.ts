import { z } from "zod";
import { outboundFetch } from "@/lib/net/outbound";
import { executeGraphql } from "@/tools/graphql-client/lib/graphql";
import type { BenchTool } from "@/lib/mcp/types";

const GRAPHQL_MAX_BYTES = 2 * 1024 * 1024;

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

async function pinnedGraphqlFetch(url: string, init: RequestInit | undefined, timeoutMs: number): Promise<Response> {
  const response = await outboundFetch(url, {
    method: init?.method,
    headers: init?.headers,
    body: typeof init?.body === "string" ? init.body : null,
    signal: init?.signal ?? undefined,
    timeoutMs,
    maxBytes: GRAPHQL_MAX_BYTES,
    maxRedirects: 0,
    followRedirects: false,
    ports: "any",
    schemes: ["http", "https"],
    tooLargeMessage: "Response is larger than 2 MB.",
  });
  return new Response(Buffer.from(response.body), { status: response.status, headers: response.headers });
}

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const result = await executeGraphql({
    endpoint: parsed.endpoint,
    query: parsed.query,
    variablesText: parsed.variables ? JSON.stringify(parsed.variables) : "",
    headers: Object.entries(parsed.headers ?? {}).map(([name, value]) => ({ name, value })),
    timeoutMs: parsed.timeoutMs,
  }, (url, init) => pinnedGraphqlFetch(String(url), init, parsed.timeoutMs));
  return outputSchema.parse(result);
}

export const tool: BenchTool = {
  slug: "graphql-client",
  name: "execute_graphql",
  title: "Execute a GraphQL query",
  description:
    "Send a GraphQL query with optional variables and headers to a public http or https endpoint and return the response data or errors. Local, private, and internal addresses are refused.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
