import { z } from "zod";
import type { BenchTool } from "@/lib/mcp/types";
import { outputFormats } from "@/lib/image-format";
import { conversionPlan } from "@/tools/image-convert/lib/convert";

export const inputSchema = z.object({
  filename: z.string().describe("Original file name, including the extension when you have one."),
  mime: z.string().default("").describe("MIME type from the file, or an empty string."),
  target: z.enum(outputFormats).default("jpeg"),
});

export const outputSchema = z.object({
  source: z.string(),
  heic: z.boolean(),
  filename: z.string(),
  mime: z.string(),
  extension: z.string(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  return outputSchema.parse(conversionPlan(parsed.filename, parsed.mime, parsed.target));
}

export const tool: BenchTool = {
  slug: "image-convert",
  name: "plan_image_conversion",
  title: "Plan an image conversion",
  description: "Return the output filename, extension, and MIME type for converting an image to JPEG, PNG, WebP, or AVIF. Pixel encoding runs in the browser tool so the file stays on the device.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
