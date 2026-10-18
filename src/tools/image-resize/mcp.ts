import { z } from "zod";
import { mcpFileSchema, readMcpBytes } from "@/lib/mcp/bytes";
import { resizeImage } from "@/lib/mcp/image";
import type { BenchTool } from "@/lib/mcp/types";
import { fitModes, resizeModes } from "@/tools/image-resize/lib/resize";

export const inputSchema = z.object({
  file: mcpFileSchema.describe("The image. Provide url or data."),
  mode: z.enum(resizeModes).default("pixels"),
  width: z.number().positive().nullable().default(null),
  height: z.number().positive().nullable().default(null),
  percent: z.number().default(100),
  lockAspect: z.boolean().default(true),
  fit: z.enum(fitModes).default("contain"),
});

export const outputSchema = z.object({
  filename: z.string(),
  mime: z.string(),
  extension: z.string(),
  width: z.number().int(),
  height: z.number().int(),
  bytes: z.number().int(),
  data: z.string().describe("Resized image as base64."),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const file = await readMcpBytes(parsed.file, "Image");
  return outputSchema.parse(await resizeImage({
    bytes: file.bytes,
    filename: file.filename,
    mime: parsed.file.mimeType || file.mimeType,
    mode: parsed.mode,
    width: parsed.width,
    height: parsed.height,
    percent: parsed.percent,
    lockAspect: parsed.lockAspect,
    fit: parsed.fit,
  }));
}

export const tool: BenchTool = {
  slug: "image-resize",
  name: "resize_image",
  title: "Resize an image",
  description: "Resize an image by pixels or percent. Fit is contain, cover, or stretch. Send base64 or a public URL. Private addresses are refused and the decoded file is capped at 10 MB. Returns the image as base64.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
