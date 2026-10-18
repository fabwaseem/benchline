import { z } from "zod";
import { decodeBase64, encodeBase64 } from "@/lib/base64";
import type { BenchTool } from "@/lib/mcp/types";
import { imagesToPdf, orientations, pageSizes } from "@/tools/image-to-pdf/lib/images";

export const inputSchema = z.object({
  images: z.array(z.object({
    data: z.string().describe("JPEG or PNG bytes as base64. Convert WebP to PNG before calling."),
    kind: z.enum(["jpg", "png"]),
  })).min(1).max(40),
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
  const result = await imagesToPdf(
    parsed.images.map((image, index) => ({
      data: decodeBase64(image.data, `Image ${index + 1}`),
      kind: image.kind,
    })),
    { page: parsed.page, orientation: parsed.orientation, margin: parsed.margin },
  );
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
  description: "Turn JPEG and PNG images, sent as base64 in order, into one PDF. Page size is A4, Letter, or fit. Returns the PDF as base64.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
