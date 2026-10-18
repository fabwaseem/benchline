import { z } from "zod";
import type { BenchTool } from "@/lib/mcp/types";
import { markdownFromUrl } from "@/tools/html-to-markdown-url/remote";

export const inputSchema = z.object({
  url: z.string().min(1).describe("Public http or https URL. Private and local addresses are refused."),
});

export const outputSchema = z.object({
  url: z.string(),
  title: z.string(),
  markdown: z.string(),
  excerpt: z.string(),
  tokens: z.number().int(),
  chars: z.number().int(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  return outputSchema.parse(await markdownFromUrl(parsed.url));
}

export const tool: BenchTool = {
  slug: "html-to-markdown-url",
  name: "fetch_page_markdown",
  title: "Fetch a page as Markdown",
  description: "Fetch a public HTML page and return the article as Markdown, plus a title, excerpt, and o200k token count. Private and local addresses are refused. The response is capped at 800 KB.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
