import { z } from "zod";
import { encodeBase64 } from "@/lib/base64";
import { readMcpBytes } from "@/lib/mcp/bytes";
import type { BenchTool } from "@/lib/mcp/types";
import { organizePdf, turns } from "@/tools/pdf-rotate-organize/lib/organize";

export const inputSchema = z.object({
  data: z.string().optional().describe("PDF bytes as base64 or a data URI. Decoded size is capped at 10 MB. Provide data or url."),
  url: z.string().optional().describe("Public URL of a PDF. Private and local addresses are refused. Provide data or url."),
  filename: z.string().optional(),
  mimeType: z.string().optional(),
  pages: z.array(z.object({
    source: z.number().int().min(1).describe("1-based page in the original PDF. The same page may appear more than once."),
    rotate: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]).default(0),
  })).min(1).max(500),
});

export const outputSchema = z.object({
  data: z.string().describe("Organized PDF as base64."),
  pageCount: z.number().int(),
  bytes: z.number().int(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const file = await readMcpBytes(parsed, "This PDF");
  const result = await organizePdf(file.bytes, parsed.pages.map((page) => ({
    source: page.source,
    rotate: turns.includes(page.rotate) ? page.rotate : 0,
  })));
  return outputSchema.parse({
    data: encodeBase64(result.bytes),
    pageCount: result.pageCount,
    bytes: result.bytes.byteLength,
  });
}

export const tool: BenchTool = {
  slug: "pdf-rotate-organize",
  name: "organize_pdf",
  title: "Organize PDF pages",
  description: "Reorder, rotate, or drop PDF pages. Each entry names a 1-based source page and a rotation of 0, 90, 180, or 270. The same page may be listed twice. Send base64 or a public URL. Private addresses are refused.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
