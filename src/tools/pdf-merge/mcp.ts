import { z } from "zod";
import { decodeBase64, encodeBase64 } from "@/lib/base64";
import type { BenchTool } from "@/lib/mcp/types";
import { mergePdfs } from "@/tools/pdf-merge/lib/merge";

export const inputSchema = z.object({
  files: z.array(z.object({
    name: z.string().default("document.pdf"),
    data: z.string().describe("PDF bytes as base64, or a data URI."),
    pages: z.string().default("").describe("Pages to keep, such as 1-3,5. Blank keeps every page."),
  })).min(2).max(25),
});

export const outputSchema = z.object({
  data: z.string().describe("Merged PDF as base64."),
  pageCount: z.number().int(),
  bytes: z.number().int(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const result = await mergePdfs(parsed.files.map((file) => ({
    name: file.name,
    data: decodeBase64(file.data, file.name || "A PDF"),
    pages: file.pages,
  })));
  return outputSchema.parse({
    data: encodeBase64(result.bytes),
    pageCount: result.pageCount,
    bytes: result.bytes.byteLength,
  });
}

export const tool: BenchTool = {
  slug: "pdf-merge",
  name: "merge_pdf",
  title: "Merge PDF files",
  description: "Combine PDF files sent as base64. Each file can keep a page range such as 1-3,5. Returns one PDF as base64.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
