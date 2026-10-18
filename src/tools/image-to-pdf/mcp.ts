import { z } from "zod";
import { encodeBase64 } from "@/lib/base64";
import { mcpFileSchema, readMcpBytes } from "@/lib/mcp/bytes";
import { asPdfImage } from "@/lib/mcp/image";
import type { BenchTool } from "@/lib/mcp/types";
import { imagesToPdf, orientations, pageSizes } from "@/tools/image-to-pdf/lib/images";

export const inputSchema = z.object({
  images: z.array(mcpFileSchema).min(1).max(40),
  page: z.enum(pageSizes).default("a4"),
  orientation: z.enum(orientations).default("auto"),
  margin: z.number().min(0).max(144).default(0),
});

export const outputSchema = z.object({
  data: z.string().describe("PDF bytes as base64."),
  pageCount: z.number().int(),
  bytes: z.number().int(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const images = await Promise.all(parsed.images.map(async (image, index) => {
    const file = await readMcpBytes(image, `Image ${index + 1}`);
    return asPdfImage(file.bytes, file.filename, image.mimeType || file.mimeType);
  }));
  const result = await imagesToPdf(images, {
    page: parsed.page,
    orientation: parsed.orientation,
    margin: parsed.margin,
  });
  return outputSchema.parse({
    data: encodeBase64(result.bytes),
    pageCount: result.pageCount,
    bytes: result.bytes.byteLength,
  });
}

export const tool: BenchTool = {
  slug: "image-to-pdf",
  name: "images_to_pdf",
  title: "Build a PDF from images",
  description: "Turn images, sent as base64 or public URLs in order, into one PDF. JPEG and PNG are embedded directly. Other formats are converted to PNG first. Page size is A4, Letter, or fit. Private addresses are refused. Returns the PDF as base64.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
