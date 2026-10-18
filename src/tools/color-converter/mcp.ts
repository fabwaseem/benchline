import { z } from "zod";
import type { BenchTool } from "@/lib/mcp/types";
import { contrastPair, convertColor } from "@/tools/color-converter/lib/color";

export const inputSchema = z.object({
  color: z.string().describe("HEX, rgb(), hsl(), oklch(), cmyk(), or a CSS color name."),
  background: z.string().default("#ffffff").describe("Background used for the WCAG contrast ratio."),
});

export const outputSchema = z.object({
  ok: z.boolean(),
  hex: z.string(),
  rgb: z.string(),
  hsl: z.string(),
  oklch: z.string(),
  cmyk: z.string(),
  tailwind: z.string(),
  contrastRatio: z.number(),
  contrastText: z.string(),
  aaNormal: z.boolean(),
  aaLarge: z.boolean(),
  aaaNormal: z.boolean(),
  aaaLarge: z.boolean(),
});

const empty = {
  ok: false,
  hex: "",
  rgb: "",
  hsl: "",
  oklch: "",
  cmyk: "",
  tailwind: "",
  contrastRatio: 0,
  contrastText: "0:1",
  aaNormal: false,
  aaLarge: false,
  aaaNormal: false,
  aaaLarge: false,
};

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const color = convertColor(parsed.color);
  const contrast = contrastPair(parsed.color, parsed.background);
  if (!color || !contrast) return outputSchema.parse(empty);
  return outputSchema.parse({
    ok: true,
    hex: color.hex,
    rgb: color.rgb,
    hsl: color.hsl,
    oklch: color.oklch,
    cmyk: color.cmyk,
    tailwind: color.tailwind,
    contrastRatio: contrast.ratio,
    contrastText: contrast.ratioText,
    aaNormal: contrast.aaNormal,
    aaLarge: contrast.aaLarge,
    aaaNormal: contrast.aaaNormal,
    aaaLarge: contrast.aaaLarge,
  });
}

export const tool: BenchTool = {
  slug: "color-converter",
  name: "convert_color",
  title: "Convert a color and check contrast",
  description: "Convert HEX, RGB, HSL, OKLCH, or CMYK into every format, name the nearest Tailwind token, and report the WCAG 2 contrast ratio against a background.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
