import { z } from "zod";
import { encodeBase64 } from "@/lib/base64";
import { readMcpBytes } from "@/lib/mcp/bytes";
import type { BenchTool } from "@/lib/mcp/types";
import { splitModes, splitPdf } from "@/tools/pdf-split/lib/split";

export const inputSchema = z.object({
  name: z.string().default("document.pdf"),
  data: z.string().optional().describe("PDF bytes as base64 or a data URI. Decoded size is capped at 10 MB. Provide data or url."),
  url: z.string().optional().describe("Public URL of a PDF. Private and local addresses are refused. Provide data or url."),
  filename: z.string().optional(),
  mimeType: z.string().optional(),
  range: z.string().default("").describe("Pages to keep, such as 1-3,5. Blank keeps every page."),
  mode: z.enum(splitModes).default("extract"),
  every: z.number().int().min(1).max(500).default(1).describe("Used when mode is chunks."),
});

export const outputSchema = z.object({
  files: z.array(z.object({ name: z.string(), data: z.string() })),
  zip: z.string().nullable().describe("ZIP of the PDFs when there is more than one, otherwise null."),
  pageCount: z.number().int(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const file = await readMcpBytes(parsed, parsed.name || "This PDF");
  const result = await splitPdf(file.bytes, parsed);
  return outputSchema.parse({
    files: result.files.map((item) => ({ name: item.name, data: encodeBase64(item.bytes) })),
    zip: result.zip ? encodeBase64(result.zip) : null,
    pageCount: result.pageCount,
  });
}

export const tool: BenchTool = {
  slug: "pdf-split",
  name: "split_pdf",
  title: "Split a PDF",
  description: "Extract a page range into one PDF, or split into single pages or chunks of N. Send base64 or a public URL. Private addresses are refused. Returns PDF base64 and a ZIP when there are several files.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
