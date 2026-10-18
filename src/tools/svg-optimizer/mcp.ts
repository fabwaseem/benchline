import { optimize } from "svgo";
import { z } from "zod";
import { mcpFileSchema, readMcpBytes } from "@/lib/mcp/bytes";
import type { BenchTool } from "@/lib/mcp/types";
import { clampPrecision, defaultSvgOptions, svgConfig, svgPluginIds, svgSavings, type SvgPluginId } from "@/tools/svg-optimizer/lib/svg";

const MAX_SVG = 1_500_000;

export const inputSchema = z.object({
  svg: z.string().optional().describe("SVG markup. Provide svg or file."),
  file: mcpFileSchema.optional().describe("An SVG file. Provide svg or file."),
  precision: z.number().int().min(0).max(8).default(3),
  removeViewBox: z.boolean().default(false),
  removeDimensions: z.boolean().default(false),
}).superRefine((value, ctx) => {
  const hasSvg = Boolean(value.svg?.trim());
  const hasFile = Boolean(value.file?.url?.trim() || value.file?.data?.trim());
  if (hasSvg === hasFile) {
    ctx.addIssue({ code: "custom", message: "Provide svg or file, not both." });
  }
});

export const outputSchema = z.object({
  svg: z.string(),
  beforeBytes: z.number().int(),
  afterBytes: z.number().int(),
  savedBytes: z.number().int(),
  savedPercent: z.number(),
});

function pluginMap(source: SvgPluginId[]) {
  const plugins = { ...defaultSvgOptions().plugins };
  if (source.length === 0) return plugins;
  for (const id of svgPluginIds) plugins[id] = source.includes(id);
  return plugins;
}

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  let markup = parsed.svg ?? "";
  if (!markup.trim() && parsed.file) {
    const file = await readMcpBytes(parsed.file, "SVG");
    markup = new TextDecoder().decode(file.bytes);
  }
  if (markup.length > MAX_SVG) throw new Error("SVG markup is larger than 1.5 million characters.");
  if (!markup.includes("<svg")) throw new Error("This file does not look like SVG.");
  let data: string;
  try {
    data = optimize(markup, svgConfig({
      precision: clampPrecision(parsed.precision),
      plugins: pluginMap([]),
      removeViewBox: parsed.removeViewBox,
      removeDimensions: parsed.removeDimensions,
    })).data;
  } catch {
    throw new Error("This SVG could not be optimized.");
  }
  return outputSchema.parse({ svg: data, ...svgSavings(markup, data) });
}

export const tool: BenchTool = {
  slug: "svg-optimizer",
  name: "optimize_svg",
  title: "Optimize an SVG",
  description: "Minify an SVG with SVGO. Send markup or a file as base64 or a public URL. Private addresses are refused and the file is capped at 10 MB. The viewBox is kept unless removeViewBox is true. Returns the optimized markup and the byte counts.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
