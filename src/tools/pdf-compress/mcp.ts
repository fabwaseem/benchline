import { z } from "zod";
import { encodeBase64 } from "@/lib/base64";
import { readMcpBytes } from "@/lib/mcp/bytes";
import type { BenchTool } from "@/lib/mcp/types";
import { compressPdf, presets } from "@/tools/pdf-compress/lib/compress";

export const inputSchema = z.object({
  data: z.string().optional().describe("PDF bytes as base64 or a data URI. Decoded size is capped at 10 MB. Provide data or url."),
  url: z.string().optional().describe("Public URL of a PDF. Private and local addresses are refused. Provide data or url."),
  filename: z.string().optional(),
  mimeType: z.string().optional(),
  preset: z.enum(presets).default("medium"),
  targetBytes: z.number().int().positive().max(20_000_000).nullable().default(null).describe("Optional size ceiling in bytes, such as 102400."),
});

export const outputSchema = z.object({
  data: z.string().describe("PDF bytes as base64. The original is returned when compression would grow the file."),
  before: z.number().int(),
  after: z.number().int(),
  saved: z.number().int(),
  percent: z.number(),
  pages: z.number().int(),
  images: z.number().int(),
  recompressed: z.number().int(),
  metTarget: z.boolean(),
  keptOriginal: z.boolean(),
  note: z.string(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const file = await readMcpBytes(parsed, "This PDF");
  const result = await compressPdf(file.bytes, {
    preset: parsed.preset,
    targetBytes: parsed.targetBytes,
  });
  return outputSchema.parse({
    data: encodeBase64(result.bytes),
    before: result.before,
    after: result.after,
    saved: result.saved,
    percent: result.percent,
    pages: result.pages,
    images: result.images,
    recompressed: result.recompressed,
    metTarget: result.metTarget,
    keptOriginal: result.keptOriginal,
    note: result.note,
  });
}

export const tool: BenchTool = {
  slug: "pdf-compress",
  name: "compress_pdf",
  title: "Compress a PDF",
  description: "Recompress embedded images in a PDF. Presets are light, medium, and strong. Send base64 or a public URL. Private addresses are refused. An optional target size tries harder. Returns the PDF and the sizes before and after.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
