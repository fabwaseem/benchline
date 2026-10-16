import { z } from "zod";
import { inspectPublicUrl } from "@/tools/meta-tags-inspector/remote";
import type { BenchTool } from "@/lib/mcp/types";

const check = z.object({ level: z.enum(["pass", "warn", "fail"]), label: z.string(), detail: z.string() });

export const inputSchema = z.object({
  url: z.string().describe("A public HTML page. Only that URL is fetched."),
});

export const outputSchema = z.object({
  status: z.number(),
  redirects: z.array(z.string()),
  finalUrl: z.string(),
  title: z.string(),
  description: z.string(),
  canonical: z.string(),
  robots: z.string(),
  viewport: z.string(),
  lang: z.string(),
  themeColor: z.string(),
  og: z.record(z.string(), z.string()),
  twitter: z.record(z.string(), z.string()),
  icons: z.array(z.string()),
  jsonLdTypes: z.array(z.string()),
  checks: z.array(check),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  return outputSchema.parse(await inspectPublicUrl(parsed.url));
}

export const tool: BenchTool = {
  slug: "meta-tags-inspector",
  name: "inspect_meta_tags",
  title: "Inspect meta tags",
  description: "Fetch one public HTML page and report title, description, canonical, Open Graph, Twitter, and JSON-LD. Use this to see what a live URL advertises.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
