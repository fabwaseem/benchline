import { z } from "zod";
import type { BenchTool } from "@/lib/mcp/types";
import { analyzeSitemap, generateSitemap } from "@/tools/sitemap-validator/lib/sitemap";
import { inspectSitemap } from "@/tools/sitemap-validator/remote";

const issue = z.object({ level: z.enum(["pass", "warn", "fail", "info"]), label: z.string(), detail: z.string() });
const url = z.object({ loc: z.string(), lastmod: z.string(), changefreq: z.string(), priority: z.string() });

export const inputSchema = z.object({
  url: z.string().optional().describe("Public sitemap URL. Private addresses are refused."),
  xml: z.string().optional().describe("Sitemap XML. Use this or url."),
  urls: z.array(z.string()).max(5000).optional().describe("URLs to place in a generated sitemap. When set, url and xml are ignored."),
  probe: z.boolean().default(true).describe("Request a sample of locations and report HTTP status."),
});

export const outputSchema = z.object({
  kind: z.enum(["urlset", "index", "unknown"]),
  urlCount: z.number(),
  sitemapCount: z.number(),
  urls: z.array(url),
  sitemaps: z.array(z.string()),
  issues: z.array(issue),
  xml: z.string(),
  source: z.string(),
  probes: z.array(z.object({ url: z.string(), status: z.number(), error: z.string() })),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  if (parsed.urls && parsed.urls.length > 0) {
    const generated = generateSitemap(parsed.urls);
    if ("error" in generated) throw new Error(generated.error);
    return outputSchema.parse({ ...generated.report, xml: generated.xml, source: "", probes: [] });
  }
  if (parsed.xml?.trim() && !parsed.url?.trim()) {
    const report = analyzeSitemap(parsed.xml);
    if ("error" in report) throw new Error(report.error);
    return outputSchema.parse({ ...report, xml: parsed.xml, source: "", probes: [] });
  }
  const report = await inspectSitemap({ url: parsed.url, xml: parsed.xml, probe: parsed.probe });
  return outputSchema.parse({ ...report, xml: "" });
}

export const tool: BenchTool = {
  slug: "sitemap-validator",
  name: "validate_sitemap",
  title: "Validate or generate a sitemap",
  description: "Validate sitemap XML or a public sitemap URL, including a sitemap index and a sample of HTTP statuses. Or generate a urlset from a list of URLs. Private addresses are refused and responses are size-capped.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
