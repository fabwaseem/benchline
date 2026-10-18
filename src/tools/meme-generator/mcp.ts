import { z } from "zod";
import sharp from "sharp";
import { encodeBase64 } from "@/lib/base64";
import { mcpFileSchema, readMcpBytes } from "@/lib/mcp/bytes";
import type { BenchTool } from "@/lib/mcp/types";
import { isImageMime, MEME_STYLES, normalizeCaption } from "@/tools/meme-generator/lib/meme";
import { renderMemePng } from "@/tools/meme-generator/lib/meme-png";

export const inputSchema = z.object({
  image: mcpFileSchema
    .optional()
    .describe("Base image as base64, a data URI, or a public URL. Private addresses are refused. 10 MB cap. Omit to use a gradient style background."),
  styleId: z
    .string()
    .optional()
    .describe(`Gradient style id when no image is given: ${MEME_STYLES.map((style) => style.id).join(", ")}. Default: sunset.`),
  top: z.string().max(500).default(""),
  bottom: z.string().max(500).default(""),
  upper: z.boolean().default(true).describe("Uppercase captions, classic meme style."),
  fontScale: z.number().min(0.5).max(1.5).default(1).describe("Caption size multiplier."),
});

export const outputSchema = z.object({
  png: z.string().describe("PNG bytes, base64 encoded."),
  width: z.number().int(),
  height: z.number().int(),
  mimeType: z.literal("image/png"),
});

const MAX_DIM = 2048;

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const top = normalizeCaption(parsed.top, parsed.upper);
  const bottom = normalizeCaption(parsed.bottom, parsed.upper);
  let imageDataUri: string | undefined;
  let imageWidth: number | undefined;
  let imageHeight: number | undefined;
  if (parsed.image) {
    const file = await readMcpBytes(parsed.image, "Image");
    if (file.mimeType && !isImageMime(file.mimeType)) throw new Error("The image must be an image file.");
    const meta = await sharp(file.bytes, { failOn: "none" }).metadata();
    const rawWidth = meta.width ?? 0;
    const rawHeight = meta.height ?? 0;
    if (!rawWidth || !rawHeight) throw new Error("Could not read the image dimensions.");
    const scale = Math.min(1, MAX_DIM / Math.max(rawWidth, rawHeight));
    imageWidth = Math.max(1, Math.round(rawWidth * scale));
    imageHeight = Math.max(1, Math.round(rawHeight * scale));
    imageDataUri = `data:${file.mimeType || "image/png"};base64,${encodeBase64(file.bytes)}`;
  }
  const rendered = await renderMemePng({
    imageDataUri,
    imageWidth,
    imageHeight,
    styleId: parsed.styleId,
    top,
    bottom,
    fontScale: parsed.fontScale,
  });
  return outputSchema.parse({
    png: encodeBase64(rendered.png),
    width: rendered.width,
    height: rendered.height,
    mimeType: "image/png",
  });
}

export const tool: BenchTool = {
  slug: "meme-generator",
  name: "generate_meme",
  title: "Generate a meme image",
  description:
    "Render a classic top/bottom-caption meme as a PNG. Give it an image (base64, data URI, or public URL) or pick a gradient style, and it returns captioned meme artwork.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
