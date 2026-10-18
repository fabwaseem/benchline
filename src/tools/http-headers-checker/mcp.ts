import { z } from "zod";
import type { BenchTool } from "@/lib/mcp/types";
import { checkHeaders } from "@/tools/http-headers-checker/remote";

const check = z.object({ level: z.enum(["pass", "warn", "fail", "info"]), label: z.string(), detail: z.string() });

export const inputSchema = z.object({
  url: z.string().describe("Public http or https URL. Private addresses are refused."),
});

export const outputSchema = z.object({
  finalUrl: z.string(),
  status: z.number(),
  redirects: z.array(z.object({ url: z.string(), status: z.number(), location: z.string() })),
  headers: z.array(z.object({ name: z.string(), value: z.string() })),
  grade: z.enum(["A", "B", "C", "D", "F"]),
  checks: z.array(check),
  elapsedMs: z.number(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  return outputSchema.parse(await checkHeaders(parsed.url));
}

export const tool: BenchTool = {
  slug: "http-headers-checker",
  name: "check_http_headers",
  title: "Check HTTP response headers",
  description: "Fetch a public URL, follow redirects, and grade HSTS, Content-Security-Policy, framing, nosniff, and Referrer-Policy. Private addresses are refused. The body is not stored.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
