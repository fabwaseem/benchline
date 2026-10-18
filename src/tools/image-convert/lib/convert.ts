import { extensionFor, mimeFor, outputFilename, sniffFormat, type OutputFormat } from "@/lib/image-format";

export const convertTargets = ["jpeg", "png", "webp", "avif"] as const satisfies readonly OutputFormat[];

export function conversionPlan(filename: string, mime: string, target: OutputFormat) {
  const source = sniffFormat(filename, mime);
  return {
    source,
    heic: source === "heic",
    filename: outputFilename(filename, target),
    mime: mimeFor(target),
    extension: extensionFor(target),
  };
}
