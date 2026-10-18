import { z } from "zod";
import type { BenchTool } from "@/lib/mcp/types";
import { fitModes, placement, planResize, resizeModes } from "@/tools/image-resize/lib/resize";

export const inputSchema = z.object({
  sourceWidth: z.number().positive(),
  sourceHeight: z.number().positive(),
  mode: z.enum(resizeModes).default("pixels"),
  width: z.number().positive().nullable().default(null),
  height: z.number().positive().nullable().default(null),
  percent: z.number().default(100),
  lockAspect: z.boolean().default(true),
  fit: z.enum(fitModes).default("contain"),
});

export const outputSchema = z.object({
  width: z.number(),
  height: z.number(),
  crop: z.object({
    sx: z.number(),
    sy: z.number(),
    sw: z.number(),
    sh: z.number(),
  }),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const size = planResize(parsed);
  const frame = placement(parsed.sourceWidth, parsed.sourceHeight, size.width, size.height, parsed.fit);
  return outputSchema.parse({
    width: size.width,
    height: size.height,
    crop: { sx: frame.sx, sy: frame.sy, sw: frame.sw, sh: frame.sh },
  });
}

export const tool: BenchTool = {
  slug: "image-resize",
  name: "plan_image_resize",
  title: "Plan an image resize",
  description: "Return the output pixel size and crop for a resize by pixels or percent, with aspect lock and contain, cover, or stretch. Drawing runs in the browser tool so the file stays on the device.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
