import { z } from "zod";
import { mcpFileSchema, readMcpBytes } from "@/lib/mcp/bytes";
import { convertImage } from "@/lib/mcp/image";
import type { BenchTool } from "@/lib/mcp/types";
import { outputFormats } from "@/lib/image-format";

export const inputSchema = z.object({
  file: mcpFileSchema.describe("The image. Provide url or data."),
  target: z.enum(outputFormats).default("jpeg"),
});

export const outputSchema = z.object({
  source: z.string(),
  filename: z.string(),
  mime: z.string(),
  extension: z.string(),
  width: z.number().int(),
  height: z.number().int(),
  bytes: z.number().int(),
  data: z.string().describe("Encoded image as base64."),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const file = await readMcpBytes(parsed.file, "Image");
  return outputSchema.parse(await convertImage({
    bytes: file.bytes,
    filename: file.filename,
    mime: parsed.file.mimeType || file.mimeType,
    target: parsed.target,
  }));
}

export const tool: BenchTool = {
  slug: "image-convert",
  name: "convert_image",
  title: "Convert an image",
  description: "Convert an image to JPEG, PNG, WebP, or AVIF. Send base64 or a public URL. Private addresses are refused and the decoded file is capped at 10 MB. Returns the image as base64. HEIC is not decoded here.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
