import sharp from "sharp";
import { z } from "zod";
import { encodeBase64 } from "@/lib/base64";
import { mcpFileSchema, readMcpBytes } from "@/lib/mcp/bytes";
import type { BenchTool } from "@/lib/mcp/types";
import { coverCrop, presetById, SOCIAL_PRESETS, type SocialPresetId } from "@/tools/social-image-resizer/lib/social";

const MAX_EDGE = 8192;

const presetIds = SOCIAL_PRESETS.map((preset) => preset.id) as [SocialPresetId, ...SocialPresetId[]];

export const inputSchema = z.object({
  file: mcpFileSchema.describe("The image. Provide url or data."),
  preset: z.enum(presetIds).describe("Social platform preset with exact pixel dimensions."),
});

export const outputSchema = z.object({
  data: z.string().describe("Resized image as base64 PNG."),
  width: z.number().int(),
  height: z.number().int(),
  bytes: z.number().int(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const preset = presetById(parsed.preset);
  if (!preset) throw new Error("Unknown preset.");
  const file = await readMcpBytes(parsed.file, "Image");
  try {
    const image = sharp(file.bytes, { failOn: "none", limitInputPixels: MAX_EDGE * MAX_EDGE, animated: false }).rotate();
    const meta = await image.metadata();
    const sourceWidth = meta.width ?? 0;
    const sourceHeight = meta.height ?? 0;
    if (sourceWidth < 1 || sourceHeight < 1) throw new Error("The image has no pixels.");
    if (sourceWidth > MAX_EDGE || sourceHeight > MAX_EDGE) throw new Error("The image is larger than 8192 pixels on a side.");
    const rect = coverCrop(sourceWidth, sourceHeight, preset.width, preset.height, 0.5, 0.5);
    const { data, info } = await image
      .extract({ left: rect.sx, top: rect.sy, width: rect.sw, height: rect.sh })
      .resize(preset.width, preset.height)
      .png()
      .toBuffer({ resolveWithObject: true });
    return outputSchema.parse({
      data: encodeBase64(new Uint8Array(data)),
      width: info.width,
      height: info.height,
      bytes: data.byteLength,
    });
  } catch (error) {
    if (error instanceof Error && /8192|no pixels/.test(error.message)) throw error;
    throw new Error("This image could not be resized. Use JPEG, PNG, WebP, AVIF, or GIF.");
  }
}

export const tool: BenchTool = {
  slug: "social-image-resizer",
  name: "resize_social_image",
  title: "Resize an image to social media dimensions",
  description: "Crop and resize an image to an exact social media preset: instagram-post (1080x1080), instagram-portrait (1080x1350), instagram-story (1080x1920), youtube-thumbnail (1280x720), x-post (1200x675), x-header (1500x500), linkedin-post (1200x627), or facebook-post (1200x630). The cover crop keeps the center subject. Send base64 or a public URL. Private addresses are refused and the decoded file is capped at 10 MB. Returns the image as base64 PNG.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
