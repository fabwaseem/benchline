import { z } from "zod";
import { encodeBase64 } from "@/lib/base64";
import { pdfFileSchema, readMcpBytes } from "@/lib/mcp/bytes";
import type { BenchTool } from "@/lib/mcp/types";
import { mergePdfs } from "@/tools/pdf-merge/lib/merge";

export const inputSchema = z.object({
  files: z.array(pdfFileSchema).min(2).max(25),
});

export const outputSchema = z.object({
  data: z.string().describe("Merged PDF as base64."),
  pageCount: z.number().int(),
  bytes: z.number().int(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const files = await Promise.all(parsed.files.map(async (file, index) => {
    const read = await readMcpBytes(file, file.name || `PDF ${index + 1}`);
    return { name: file.name || read.filename || "document.pdf", data: read.bytes, pages: file.pages };
  }));
  const result = await mergePdfs(files);
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
  description: "Combine PDF files. Each file is base64 or a public URL, and can keep a page range such as 1-3,5. Private addresses are refused. Returns one PDF as base64.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
