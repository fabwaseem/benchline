import { z } from "zod";
import { readMcpBytes } from "@/lib/mcp/bytes";
import type { BenchTool } from "@/lib/mcp/types";
import { extractPdfText } from "@/tools/pdf-to-text/lib/extract";

export const inputSchema = z.object({
  data: z.string().optional().describe("PDF bytes as base64 or a data URI. Decoded size is capped at 10 MB. Provide data or url."),
  url: z.string().optional().describe("Public URL of a PDF. Private and local addresses are refused. Provide data or url."),
  filename: z.string().optional(),
  mimeType: z.string().optional(),
});

const pageSchema = z.object({
  page: z.number().int(),
  text: z.string(),
  markdown: z.string(),
});

export const outputSchema = z.object({
  pageCount: z.number().int(),
  pages: z.array(pageSchema),
  text: z.string(),
  markdown: z.string(),
  tokens: z.number().int(),
  emptyPages: z.number().int(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const file = await readMcpBytes(parsed, "This PDF");
  return outputSchema.parse(await extractPdfText(file.bytes));
}

export const tool: BenchTool = {
  slug: "pdf-to-text",
  name: "extract_pdf_text",
  title: "Extract PDF text",
  description: "Read the selectable text layer of a PDF. Returns per-page text, markdown-style headings, and an o200k token count. Does not OCR scans. Send base64 or a public URL. Private addresses are refused.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
