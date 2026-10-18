import { z } from "zod";
import { encodeBase64 } from "@/lib/base64";
import { readMcpBytes } from "@/lib/mcp/bytes";
import type { BenchTool } from "@/lib/mcp/types";
import { imageFormats } from "@/tools/pdf-to-image/lib/plan";
import { renderPdfPages } from "@/tools/pdf-to-image/lib/render-server";

export const inputSchema = z.object({
  data: z.string().optional().describe("PDF bytes as base64 or a data URI. Decoded size is capped at 10 MB. Provide data or url."),
  url: z.string().optional().describe("Public URL of a PDF. Private and local addresses are refused. Provide data or url."),
  filename: z.string().optional(),
  mimeType: z.string().optional(),
  format: z.enum(imageFormats).default("png"),
  dpi: z.number().int().min(72).max(216).default(72),
  range: z.string().default("").describe("Pages to render, such as 1-3,5. Blank renders every page, up to 24."),
  quality: z.number().int().min(1).max(100).default(82).describe("JPEG quality from 1 to 100. Ignored for PNG."),
});

export const outputSchema = z.object({
  images: z.array(z.object({
    name: z.string(),
    data: z.string().describe("Image bytes as base64."),
    width: z.number().int(),
    height: z.number().int(),
  })),
  zip: z.string().nullable().describe("ZIP of the images when there is more than one, otherwise null."),
  pageCount: z.number().int(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const file = await readMcpBytes(parsed, "This PDF");
  const result = await renderPdfPages(file.bytes, {
    format: parsed.format,
    dpi: parsed.dpi,
    range: parsed.range,
    quality: parsed.quality,
    stem: file.filename || parsed.filename,
  });
  return outputSchema.parse({
    images: result.images.map((image) => ({
      name: image.name,
      data: encodeBase64(image.bytes),
      width: image.width,
      height: image.height,
    })),
    zip: result.zip ? encodeBase64(result.zip) : null,
    pageCount: result.pageCount,
  });
}

export const tool: BenchTool = {
  slug: "pdf-to-image",
  name: "render_pdf_pages",
  title: "Render PDF pages",
  description: "Render PDF pages to PNG or JPEG. DPI is 72 to 216. A page range such as 1-3,5 is optional. At most 24 pages and 25 MB of images. Send base64 or a public URL. Private addresses are refused. Returns image base64 and a ZIP when there is more than one page.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
