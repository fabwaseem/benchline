import type { Config } from "svgo";

export const svgPluginIds = [
  "cleanupAttrs",
  "removeDoctype",
  "removeComments",
  "removeMetadata",
  "removeUselessDefs",
  "cleanupIds",
  "convertColors",
  "removeUselessStrokeAndFill",
  "removeHiddenElems",
  "mergePaths",
  "convertPathData",
  "sortAttrs",
  "removeXMLProcInst",
] as const;

export type SvgPluginId = (typeof svgPluginIds)[number];

export const svgPluginLabels: Record<SvgPluginId, string> = {
  cleanupAttrs: "Clean attributes",
  removeDoctype: "Remove the doctype",
  removeComments: "Remove comments",
  removeMetadata: "Remove metadata",
  removeUselessDefs: "Remove unused defs",
  cleanupIds: "Shorten IDs",
  convertColors: "Shorten colors",
  removeUselessStrokeAndFill: "Drop unused stroke and fill",
  removeHiddenElems: "Remove hidden elements",
  mergePaths: "Merge paths",
  convertPathData: "Simplify paths",
  sortAttrs: "Sort attributes",
  removeXMLProcInst: "Remove the XML declaration",
};

export type SvgOptions = {
  precision: number;
  plugins: Partial<Record<SvgPluginId, boolean>>;
  removeViewBox: boolean;
  removeDimensions: boolean;
};

export function defaultSvgOptions(): SvgOptions {
  const plugins = {} as Record<SvgPluginId, boolean>;
  for (const id of svgPluginIds) plugins[id] = true;
  return { precision: 3, plugins, removeViewBox: false, removeDimensions: false };
}

export function clampPrecision(value: number) {
  if (!Number.isFinite(value)) return 3;
  return Math.min(8, Math.max(0, Math.round(value)));
}

export function svgConfig(options: SvgOptions): Config {
  const precision = clampPrecision(options.precision);
  const overrides: Record<string, false> = {};
  for (const id of svgPluginIds) {
    if (options.plugins[id] === false) overrides[id] = false;
  }
  const plugins: NonNullable<Config["plugins"]> = [
    { name: "preset-default", params: { floatPrecision: precision, overrides } },
    "removeScripts",
  ];
  if (options.removeViewBox) plugins.push("removeViewBox");
  if (options.removeDimensions) plugins.push("removeDimensions");
  return { multipass: true, floatPrecision: precision, plugins };
}

export function textBytes(value: string) {
  return new TextEncoder().encode(value).length;
}

export function svgSavings(before: string, after: string) {
  const beforeBytes = textBytes(before);
  const afterBytes = textBytes(after);
  const savedBytes = beforeBytes - afterBytes;
  const savedPercent = beforeBytes > 0 ? (savedBytes / beforeBytes) * 100 : 0;
  return { beforeBytes, afterBytes, savedBytes, savedPercent };
}
