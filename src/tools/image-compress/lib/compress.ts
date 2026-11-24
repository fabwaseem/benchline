import { capBox, clampQuality, resolveOutput, savings, sniffFormat } from "@/lib/image-format";

export const compressChoices = ["original", "jpeg", "png", "webp", "avif"] as const;

export type CompressChoice = (typeof compressChoices)[number];

export function compressionPlan(input: {
  filename: string;
  mime: string;
  choice: CompressChoice;
  quality: number;
  sourceWidth: number;
  sourceHeight: number;
  maxEdge: number | null;
  beforeBytes: number;
  afterBytes: number;
}) {
  const source = sniffFormat(input.filename, input.mime);
  const format = resolveOutput(source, input.choice);
  const box = capBox(input.sourceWidth, input.sourceHeight, input.maxEdge);
  return {
    source,
    format,
    quality: clampQuality(input.quality),
    width: box.width,
    height: box.height,
    ...savings(input.beforeBytes, input.afterBytes),
  };
}

/**
 * True when re-encoding only made the file bigger and nothing else was asked for
 * (same format, same size), so the original is the better answer.
 */
export function keepsOriginal(input: {
  source: string;
  format: string;
  sourceWidth: number;
  sourceHeight: number;
  width: number;
  height: number;
  beforeBytes: number;
  afterBytes: number;
}): boolean {
  return (
    input.afterBytes >= input.beforeBytes &&
    input.source === input.format &&
    input.width === input.sourceWidth &&
    input.height === input.sourceHeight
  );
}
