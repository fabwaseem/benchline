import { z } from "zod";
import { analyzeHarText } from "@/tools/har-analyzer/lib/har";
import type { BenchTool } from "@/lib/mcp/types";

const harEntrySchema = z.object({
  method: z.string(),
  url: z.string(),
  host: z.string(),
  status: z.number().int(),
  timeMs: z.number(),
  sizeBytes: z.number().int(),
  timings: z.object({
    blocked: z.number(),
    dns: z.number(),
    connect: z.number(),
    send: z.number(),
    wait: z.number(),
    receive: z.number(),
  }),
});

export const inputSchema = z.object({
  har: z.string().min(1).describe("HAR file contents as JSON text"),
  top: z.number().int().min(1).max(20).default(5).describe("How many slowest/largest requests and top hosts to include"),
});

export const outputSchema = z.object({
  totalRequests: z.number().int(),
  totalTimeMs: z.number(),
  totalBytes: z.number().int(),
  truncated: z.boolean(),
  statusGroups: z.object({
    "2xx": z.number().int(),
    "3xx": z.number().int(),
    "4xx": z.number().int(),
    "5xx": z.number().int(),
    other: z.number().int(),
  }),
  slowest: z.array(harEntrySchema),
  largest: z.array(harEntrySchema),
  topHosts: z.array(z.object({ host: z.string(), requests: z.number().int(), bytes: z.number().int() })),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const analysis = analyzeHarText(parsed.har, parsed.top);
  if ("error" in analysis) throw new Error(analysis.error);
  const { summary } = analysis;
  const pick = (entry: (typeof analysis.entries)[number]) => ({
    method: entry.method,
    url: entry.url,
    host: entry.host,
    status: entry.status,
    timeMs: entry.timeMs,
    sizeBytes: entry.sizeBytes,
    timings: entry.timings,
  });
  return outputSchema.parse({
    totalRequests: summary.totalRequests,
    totalTimeMs: summary.totalTimeMs,
    totalBytes: summary.totalBytes,
    truncated: summary.truncated,
    statusGroups: summary.statusGroups,
    slowest: summary.slowest.map(pick),
    largest: summary.largest.map(pick),
    topHosts: summary.topHosts,
  });
}

export const tool: BenchTool = {
  slug: "har-analyzer",
  name: "analyze_har",
  title: "Analyze a HAR file",
  description: "Parse a HAR (HTTP Archive) capture and summarize it: request counts, status distribution, slowest and largest requests, top hosts, and per-request timings.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
