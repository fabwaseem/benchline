import { z } from "zod";
import type { BenchTool } from "@/lib/mcp/types";
import { compressChoices, compressionPlan } from "@/tools/image-compress/lib/compress";

export const inputSchema = z.object({
  filename: z.string(),
  mime: z.string().default(""),
  choice: z.enum(compressChoices).default("original"),
  quality: z.number().default(80),
  sourceWidth: z.number().positive(),
  sourceHeight: z.number().positive(),
  maxEdge: z.number().positive().nullable().default(null),
  beforeBytes: z.number().nonnegative(),
  afterBytes: z.number().nonnegative(),
});

export const outputSchema = z.object({
  source: z.string(),
  format: z.string(),
  quality: z.number(),
  width: z.number(),
  height: z.number(),
  savedBytes: z.number(),
  savedPercent: z.number(),
  label: z.string(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  return outputSchema.parse(compressionPlan(parsed));
}

export const tool: BenchTool = {
  slug: "image-compress",
  name: "plan_image_compression",
  title: "Plan image compression",
  description: "Return the output format, clamped quality, capped pixel size, and savings for an image. Encoding runs in the browser tool so the file stays on the device.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
