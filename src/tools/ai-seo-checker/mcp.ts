import { z } from "zod";
import { scorePublicUrl } from "@/tools/ai-seo-checker/remote";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  url: z.string().describe("A public page. The check also reads robots.txt, sitemap.xml, and llms.txt on that origin."),
});

export const outputSchema = z.object({
  finalUrl: z.string(),
  status: z.number(),
  score: z.number(),
  checks: z.array(
    z.object({
      id: z.string(),
      level: z.enum(["pass", "warn", "fail"]),
      label: z.string(),
      detail: z.string(),
      weight: z.number(),
    }),
  ),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  return outputSchema.parse(await scorePublicUrl(parsed.url));
}

export const tool: BenchTool = {
  slug: "ai-seo-checker",
  name: "score_ai_seo",
  title: "Score a page for AI search",
  description: "Fetch a public page plus its robots.txt, sitemap, and llms.txt, then score how ready it is for AI search crawlers. Use this when you have a live URL.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
