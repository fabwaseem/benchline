import { z } from "zod";
import sharp from "sharp";
import { encodeBase64 } from "@/lib/base64";
import { mcpFileSchema, readMcpBytes } from "@/lib/mcp/bytes";
import type { BenchTool } from "@/lib/mcp/types";
import { layoutCells } from "@/tools/photo-collage/lib/collage";

export const inputSchema = z.object({
  images: z
    .array(mcpFileSchema)
    .min(1)
    .max(9)
    .describe("Photos as base64, data URIs, or public URLs. Private addresses are refused. 10 MB cap each."),
  layout: z
    .string()
    .default("quad")
    .describe("Layout id: duo, duo-stack, trio, focus, quad, six, nine. Unknown ids fall back to quad."),
  gap: z.number().int().min(0).max(64).default(8).describe("Gap between cells in pixels."),
  background: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use #rrggbb.")
    .default("#000000"),
  width: z.number().int().min(256).max(4096).default(1600).describe("Output width in pixels; the collage is square."),
});

export const outputSchema = z.object({
  png: z.string().describe("PNG bytes, base64 encoded."),
  width: z.number().int(),
  height: z.number().int(),
  mimeType: z.literal("image/png"),
  cells: z.number().int().describe("Cells in the layout; cells beyond the image count stay background-colored."),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const cells = layoutCells(parsed.layout, parsed.width, parsed.width, parsed.gap);
  const composites: Array<{ input: Buffer; left: number; top: number }> = [];
  const usable = Math.min(cells.length, parsed.images.length);
  for (let index = 0; index < usable; index += 1) {
    const cell = cells[index];
    if (!cell) continue;
    const file = await readMcpBytes(parsed.images[index]!, `Image ${index + 1}`);
    let resized: Buffer;
    try {
      resized = await sharp(file.bytes, { failOn: "none" }).resize(cell.w, cell.h, { fit: "cover" }).png().toBuffer();
    } catch {
      throw new Error(`Image ${index + 1} could not be decoded.`);
    }
    composites.push({ input: resized, left: cell.x, top: cell.y });
  }
  const png = await sharp({
    create: { width: parsed.width, height: parsed.width, channels: 4, background: parsed.background },
  })
    .composite(composites)
    .png()
    .toBuffer();
  return outputSchema.parse({
    png: encodeBase64(png),
    width: parsed.width,
    height: parsed.width,
    mimeType: "image/png",
    cells: cells.length,
  });
}

export const tool: BenchTool = {
  slug: "photo-collage",
  name: "make_collage",
  title: "Make a photo collage",
  description:
    "Arrange up to 9 photos into a collage layout (duo, trio, focus, quad, six, nine) with a gap and background color, and get back a square PNG.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
