import { z } from "zod";
import { renderLlmsFull, renderLlmsTxt } from "@/tools/llms-txt-generator/lib/llms";
import type { BenchTool } from "@/lib/mcp/types";

const page = z.object({
  url: z.string(),
  title: z.string(),
  description: z.string().default(""),
  excerpt: z.string().default(""),
});

export const inputSchema = z.object({
  siteName: z.string().min(1),
  summary: z.string().min(1),
  pages: z.array(page).min(1).describe("Pages you already know. This tool does not fetch them."),
});

export const outputSchema = z.object({
  llms: z.string(),
  full: z.string(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  return outputSchema.parse({
    llms: renderLlmsTxt(parsed.siteName, parsed.summary, parsed.pages),
    full: renderLlmsFull(parsed.siteName, parsed.summary, parsed.pages),
  });
}

export const tool: BenchTool = {
  slug: "llms-txt-generator",
  name: "generate_llms_txt",
  title: "Generate llms.txt",
  description: "Render llms.txt and llms-full.txt from a site name, a summary, and a list of pages. It does not crawl. Grouping follows the page URLs.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
