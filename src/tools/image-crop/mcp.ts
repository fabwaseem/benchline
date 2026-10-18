import sharp from "sharp";
import { z } from "zod";
import { encodeBase64 } from "@/lib/base64";
import { extensionFor, mimeFor, outputFilename } from "@/lib/image-format";
import { mcpFileSchema, readMcpBytes } from "@/lib/mcp/bytes";
import type { BenchTool } from "@/lib/mcp/types";
import { clampCrop, cropFormats, cropUnits, type CropFormat } from "@/tools/image-crop/lib/crop";

const MAX_EDGE = 8192;

export const inputSchema = z.object({
  file: mcpFileSchema.describe("The image. Provide url or data."),
  x: z.number().default(0),
  y: z.number().default(0),
  width: z.number().positive().default(1),
  height: z.number().positive().default(1),
  unit: z.enum(cropUnits).default("px").describe("px is source pixels. ratio is a 0 to 1 share of the source."),
  circle: z.boolean().default(false),
  format: z.enum(cropFormats).default("png"),
});

export const outputSchema = z.object({
  filename: z.string(),
  mime: z.string(),
  extension: z.string(),
  width: z.number().int(),
  height: z.number().int(),
  bytes: z.number().int(),
  data: z.string().describe("Cropped image as base64."),
});

function encode(pipeline: ReturnType<typeof sharp>, format: CropFormat) {
  if (format === "jpeg") return pipeline.flatten({ background: "#ffffff" }).jpeg({ quality: 92, mozjpeg: true });
  if (format === "webp") return pipeline.webp({ quality: 90 });
  return pipeline.png();
}

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const file = await readMcpBytes(parsed.file, "Image");
  try {
    const image = sharp(file.bytes, { failOn: "none", limitInputPixels: MAX_EDGE * MAX_EDGE, animated: false }).rotate();
    const meta = await image.metadata();
    const sourceWidth = meta.width ?? 0;
    const sourceHeight = meta.height ?? 0;
    if (sourceWidth < 1 || sourceHeight < 1) throw new Error("The image has no pixels.");
    if (sourceWidth > MAX_EDGE || sourceHeight > MAX_EDGE) throw new Error("The image is larger than 8192 pixels on a side.");
    const box = clampCrop(sourceWidth, sourceHeight, parsed, parsed.unit);
    let pipeline = image.extract({ left: box.x, top: box.y, width: box.width, height: box.height }).ensureAlpha();
    if (parsed.circle) {
      const radius = Math.min(box.width, box.height) / 2;
      const svg = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${box.width}" height="${box.height}"><circle cx="${box.width / 2}" cy="${box.height / 2}" r="${radius}" fill="#fff"/></svg>`,
      );
      pipeline = pipeline.composite([{ input: svg, blend: "dest-in" }]);
    }
    const { data, info } = await encode(pipeline, parsed.format).toBuffer({ resolveWithObject: true });
    return outputSchema.parse({
      filename: outputFilename(file.filename || "image", parsed.format),
      mime: mimeFor(parsed.format),
      extension: extensionFor(parsed.format),
      width: info.width,
      height: info.height,
      bytes: data.byteLength,
      data: encodeBase64(new Uint8Array(data)),
    });
  } catch (error) {
    if (error instanceof Error && /8192|no pixels/.test(error.message)) throw error;
    throw new Error("This image could not be cropped. Use JPEG, PNG, WebP, AVIF, or GIF.");
  }
}

export const tool: BenchTool = {
  slug: "image-crop",
  name: "crop_image",
  title: "Crop an image",
  description: "Crop an image to a pixel box or a 0 to 1 ratio box. circle cuts a round mask. format is png, jpeg, or webp. Send base64 or a public URL. Private addresses are refused and the decoded file is capped at 10 MB. Returns the image as base64.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
