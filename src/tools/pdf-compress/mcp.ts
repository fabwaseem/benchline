import { z } from "zod";
import { decodeBase64, encodeBase64 } from "@/lib/base64";
import type { BenchTool } from "@/lib/mcp/types";
import { compressPdf, presets } from "@/tools/pdf-compress/lib/compress";

export const inputSchema = z.object({
  data: z.string().describe("PDF bytes as base64, or a data URI."),
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
  const result = await compressPdf(decodeBase64(parsed.data, "This PDF"), {
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
  description: "Recompress embedded images in a PDF sent as base64. Presets are light, medium, and strong. An optional target size tries harder. Returns the PDF and the sizes before and after.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
