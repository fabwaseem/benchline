import { z } from "zod";
import { checkRobotsUrl } from "@/tools/robots-txt-checker/remote";
import type { BenchTool } from "@/lib/mcp/types";

const group = z.object({
  agents: z.array(z.string()),
  allow: z.array(z.string()),
  disallow: z.array(z.string()),
  crawlDelay: z.string().optional(),
});

export const inputSchema = z.object({
  url: z.string().describe("A public page or a robots.txt URL. A page URL is resolved to /robots.txt on that origin."),
});

export const outputSchema = z.object({
  finalUrl: z.string(),
  status: z.number(),
  text: z.string(),
  document: z.object({ groups: z.array(group), sitemaps: z.array(z.string()) }),
  issues: z.array(z.object({ level: z.enum(["pass", "warn", "fail", "info"]), label: z.string(), detail: z.string() })),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  return outputSchema.parse(await checkRobotsUrl(parsed.url));
}

export const tool: BenchTool = {
  slug: "robots-txt-checker",
  name: "check_robots_txt",
  title: "Check robots.txt",
  description: "Fetch a public robots.txt and report whether the wildcard group blocks the site and whether Sitemap lines are absolute. Use this when you have a URL, not a pasted file.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
