import { z } from "zod";
import { mcpFileSchema, readMcpBytes } from "@/lib/mcp/bytes";
import type { BenchTool } from "@/lib/mcp/types";
import { recognizeImage } from "@/tools/ocr-image-to-text/lib/recognize";

export const inputSchema = z.object({
  file: mcpFileSchema.describe("The image. Provide url or data."),
  language: z.string().default("eng").describe("A Tesseract language code such as eng, spa, fra, deu, or jpn."),
});

export const outputSchema = z.object({
  text: z.string(),
  confidence: z.number(),
  language: z.string(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const file = await readMcpBytes(parsed.file, "Image");
  return outputSchema.parse(await recognizeImage(file.bytes, parsed.language));
}

export const tool: BenchTool = {
  slug: "ocr-image-to-text",
  name: "read_image_text",
  title: "Read text from an image",
  description: "Extract text from an image with Tesseract. language defaults to eng. Other codes in the list are fetched when first used. Send base64 or a public URL. Private addresses are refused and the decoded file is capped at 10 MB. Returns the text and a confidence from 0 to 100. An image with no text returns an empty string.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
