import { z } from "zod";
import type { BenchTool } from "@/lib/mcp/types";
import { convertTargets, htmlToMarkdown, markdownToHtml } from "@/tools/markdown-html/lib/convert";

export const inputSchema = z.object({
  text: z.string().default("# Hello\n"),
  to: z.enum(convertTargets).default("html"),
  sanitize: z.boolean().default(true),
});

export const outputSchema = z.object({
  output: z.string(),
  direction: z.enum(convertTargets),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const output = parsed.to === "html"
    ? markdownToHtml(parsed.text, parsed.sanitize)
    : htmlToMarkdown(parsed.text, parsed.sanitize);
  return outputSchema.parse({ output, direction: parsed.to });
}

export const tool: BenchTool = {
  slug: "markdown-html",
  name: "convert_markdown_html",
  title: "Convert Markdown and HTML",
  description: "Convert GitHub-flavored Markdown to HTML, or HTML to Markdown. to is html or markdown. sanitize strips scripts from the text output. The conversion does not fetch a URL.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
