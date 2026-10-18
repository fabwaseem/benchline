import type { TitleSpec } from "@/tools/og-image-generator/lib/types";

export type TitleFit = {
  fontSize: number;
  maxWidth: number;
  lines: number;
  maxLines: number;
  clipped: boolean;
  notice: string;
};

export function fitTitle(title: string, fontSize: number, maxWidth: number) {
  const text = title.replace(/\s+/g, " ").trim();
  if (!text) return 1;
  const perLine = Math.max(4, Math.floor(maxWidth / Math.max(1, fontSize * 0.52)));
  const words = text.split(" ");
  let lines = 1;
  let column = 0;
  for (const word of words) {
    const length = Math.max(1, word.length);
    if (column === 0) {
      column = length;
      continue;
    }
    if (column + 1 + length > perLine) {
      lines += 1;
      column = length;
    } else {
      column += 1 + length;
    }
  }
  return lines;
}

export function fitSize(title: string, base: number, min: number, maxWidth: number, maxLines: number) {
  let size = base;
  while (size > min && fitTitle(title, size, maxWidth) > maxLines) size -= 2;
  return size;
}

export function layoutTitle(title: string, spec: TitleSpec, cardWidth: number): TitleFit {
  const scale = cardWidth / 1200;
  const maxWidth = Math.max(80, Math.round(spec.width * scale));
  const base = Math.max(12, Math.round(spec.base * scale));
  const min = Math.max(12, Math.round(spec.min * scale));
  const fontSize = fitSize(title, base, min, maxWidth, spec.maxLines);
  const lines = fitTitle(title, fontSize, maxWidth);
  const clipped = lines > spec.maxLines;
  const noun = lines === 1 ? "line" : "lines";
  return {
    fontSize,
    maxWidth,
    lines,
    maxLines: spec.maxLines,
    clipped,
    notice: `Title fits in ${lines} ${noun}.`,
  };
}
