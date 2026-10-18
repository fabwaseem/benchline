import sharp from "sharp";
import { z } from "zod";
import { encodeBase64 } from "@/lib/base64";
import { MCP_MAX_BYTES, mcpFileSchema, readMcpBytes } from "@/lib/mcp/bytes";
import type { BenchTool } from "@/lib/mcp/types";
import { parseHexColor, removeSolidBackground } from "@/tools/background-remover/lib/matte";

const MAX_EDGE = 4096;

export const inputSchema = z.object({
  file: mcpFileSchema.describe("The image. Provide url or data."),
  tolerance: z.number().min(0).max(180).default(42).describe("How far a border pixel may be from the background color, in RGB distance."),
  feather: z.boolean().default(true),
  color: z.string().optional().describe("Background color as #rgb or #rrggbb. Blank samples the corners."),
});

export const outputSchema = z.object({
  filename: z.string(),
  mime: z.string(),
  width: z.number().int(),
  height: z.number().int(),
  bytes: z.number().int(),
  data: z.string().describe("PNG with transparency as base64."),
  method: z.literal("solid"),
  note: z.string(),
});

const NOTE = "Serverless removal uses a border flood fill on a solid or near-solid background. The portrait model (MODNet, Apache-2.0) runs in the browser. RMBG-1.4 is non-commercial, and the ONNX runtime is too large to ship in the function.";

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const file = await readMcpBytes(parsed.file, "Image");
  const chosen = parsed.color?.trim() ? parseHexColor(parsed.color) : null;
  if (parsed.color?.trim() && !chosen) throw new Error("Use a background color like #ffffff.");
  try {
    const image = sharp(file.bytes, { failOn: "none", limitInputPixels: MAX_EDGE * MAX_EDGE, animated: false }).rotate().ensureAlpha();
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    if (info.width > MAX_EDGE || info.height > MAX_EDGE) throw new Error("The image is larger than 4096 pixels on a side.");
    const matte = removeSolidBackground(new Uint8Array(data), info.width, info.height, {
      tolerance: parsed.tolerance,
      feather: parsed.feather,
      color: chosen,
    });
    const png = await sharp(matte, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
    if (png.byteLength > MCP_MAX_BYTES) throw new Error("The result is larger than 10 MB.");
    const stem = (file.filename || "image").replace(/\.[^.]+$/, "") || "image";
    return outputSchema.parse({
      filename: `${stem}.png`,
      mime: "image/png",
      width: info.width,
      height: info.height,
      bytes: png.byteLength,
      data: encodeBase64(new Uint8Array(png)),
      method: "solid",
      note: NOTE,
    });
  } catch (error) {
    if (error instanceof Error && /4096|10 MB|no pixels|incomplete/.test(error.message)) throw error;
    throw new Error("This image could not be decoded. Use JPEG, PNG, WebP, AVIF, or GIF.");
  }
}

export const tool: BenchTool = {
  slug: "background-remover",
  name: "remove_background",
  title: "Remove a solid image background",
  description: "Remove a solid or near-solid background by flood-filling from the border. color is an optional #rrggbb. The portrait model runs in the browser, not in this handler: MODNet is Apache-2.0, RMBG-1.4 is non-commercial, and the ONNX runtime is too large for the serverless function. Send base64 or a public URL. Private addresses are refused and the decoded file is capped at 10 MB. Returns a PNG as base64.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
