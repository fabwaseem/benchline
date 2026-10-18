import { z } from "zod";
import { convertCurl, TARGETS, type Target } from "@/tools/curl-converter/lib/curl";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  command: z.string().min(1).max(20_000),
  target: z.enum(TARGETS).default("fetch"),
});

export const outputSchema = z.object({
  url: z.string(),
  method: z.string(),
  headers: z.array(z.object({ name: z.string(), value: z.string() })),
  body: z.string().optional(),
  snippet: z.string(),
  warnings: z.array(z.string()),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const result = convertCurl(parsed.command, parsed.target as Target);
  if ("error" in result) throw new Error(result.error);
  return outputSchema.parse({
    url: result.request.url,
    method: result.request.method,
    headers: result.request.headers,
    ...(result.request.body !== undefined ? { body: result.request.body } : {}),
    snippet: result.snippet,
    warnings: result.warnings,
  });
}

export const tool: BenchTool = {
  slug: "curl-converter",
  name: "convert_curl",
  title: "Convert a curl command to code",
  description:
    "Parse a curl command and generate equivalent JavaScript fetch, Python requests, Go, PHP, or Rust code.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
