import { z } from "zod";
import { mcpFileSchema, readMcpBytes } from "@/lib/mcp/bytes";
import { compressImage } from "@/lib/mcp/image";
import type { BenchTool } from "@/lib/mcp/types";
import { compressChoices } from "@/tools/image-compress/lib/compress";

export const inputSchema = z.object({
  file: mcpFileSchema.describe("The image. Provide url or data."),
  choice: z.enum(compressChoices).default("original"),
  quality: z.number().default(80),
  maxEdge: z.number().positive().nullable().default(null).describe("Longest edge in pixels. Omit it to keep the size."),
});

export const outputSchema = z.object({
  filename: z.string(),
  mime: z.string(),
  extension: z.string(),
  format: z.string(),
  quality: z.number(),
  width: z.number().int(),
  height: z.number().int(),
  bytes: z.number().int(),
  before: z.number().int(),
  after: z.number().int(),
  savedBytes: z.number().int(),
  savedPercent: z.number(),
  label: z.string(),
  data: z.string().describe("Compressed image as base64."),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const file = await readMcpBytes(parsed.file, "Image");
  return outputSchema.parse(await compressImage({
    bytes: file.bytes,
    filename: file.filename,
    mime: parsed.file.mimeType || file.mimeType,
    choice: parsed.choice,
    quality: parsed.quality,
    maxEdge: parsed.maxEdge,
  }));
}

export const tool: BenchTool = {
  slug: "image-compress",
  name: "compress_image",
  title: "Compress an image",
  description: "Re-encode an image at a quality from 1 to 100, optionally capping the longest edge. Send base64 or a public URL. Private addresses are refused and the decoded file is capped at 10 MB. Returns the image as base64.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
