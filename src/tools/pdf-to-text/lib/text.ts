import { countTokens } from "@/tools/ai-token-counter/lib/tokenize";

export type Glyph = { text: string; x: number; y: number; size: number };
export type TextLine = { text: string; size: number };

export type PageDraft = { page: number; text: string; markdown: string };

export type PdfText = {
  pageCount: number;
  pages: PageDraft[];
  text: string;
  markdown: string;
  tokens: number;
  emptyPages: number;
};

export function glyphsFromItems(items: unknown[]): Glyph[] {
  const glyphs: Glyph[] = [];
  for (const item of items) {
    if (!item || typeof item !== "object" || !("str" in item)) continue;
    const record = item as { str?: unknown; transform?: unknown; height?: unknown };
    if (typeof record.str !== "string" || !record.str.trim() || !Array.isArray(record.transform)) continue;
    const transform = record.transform;
    const x = typeof transform[4] === "number" ? transform[4] : 0;
    const y = typeof transform[5] === "number" ? transform[5] : 0;
    const a = typeof transform[2] === "number" ? transform[2] : 0;
    const b = typeof transform[3] === "number" ? transform[3] : 0;
    const height = typeof record.height === "number" ? record.height : 0;
    glyphs.push({ text: record.str, x, y, size: Math.hypot(a, b) || height || 12 });
  }
  return glyphs;
}

export function glyphsToLines(glyphs: Glyph[]): TextLine[] {
  const sorted = [...glyphs].sort((left, right) => right.y - left.y || left.x - right.x);
  const lines: { y: number; size: number; parts: { x: number; text: string }[] }[] = [];
  for (const glyph of sorted) {
    const tolerance = Math.max(2, glyph.size * 0.4);
    const line = lines.find((item) => Math.abs(item.y - glyph.y) <= tolerance);
    if (line) {
      line.parts.push({ x: glyph.x, text: glyph.text });
      line.size = Math.max(line.size, glyph.size);
    } else {
      lines.push({ y: glyph.y, size: glyph.size, parts: [{ x: glyph.x, text: glyph.text }] });
    }
  }
  return lines
    .map((line) => ({
      size: Math.round(line.size * 10) / 10,
      text: line.parts
        .sort((left, right) => left.x - right.x)
        .map((part) => part.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    }))
    .filter((line) => line.text.length > 0);
}

export function linesToMarkdown(lines: TextLine[]) {
  const sizes = lines.map((line) => line.size).filter((size) => size > 0).sort((left, right) => left - right);
  const body = sizes[Math.floor((sizes.length - 1) / 2)] ?? 12;
  const blocks: string[] = [];
  for (const line of lines) {
    if (line.size >= body * 1.55 && line.text.length <= 80) blocks.push(`# ${line.text}`);
    else if (line.size >= body * 1.2 && line.text.length <= 120) blocks.push(`## ${line.text}`);
    else blocks.push(line.text);
  }
  return blocks.join("\n\n");
}

export function pageFromItems(items: unknown[]) {
  const lines = glyphsToLines(glyphsFromItems(items));
  return { text: lines.map((line) => line.text).join("\n"), markdown: linesToMarkdown(lines) };
}

export function assemblePdfText(pages: PageDraft[]): PdfText {
  const text = pages.map((page) => page.text.trim()).filter(Boolean).join("\n\n");
  const markdown = pages
    .map((page) => {
      const body = page.markdown.trim() || "_No selectable text on this page._";
      return pages.length > 1 ? `## Page ${page.page}\n\n${body}` : body;
    })
    .join("\n\n");
  const emptyPages = pages.filter((page) => page.text.trim().length === 0).length;
  const body = pages.length > 0 && emptyPages === pages.length
    ? "No selectable text. This tool does not OCR scanned pages."
    : markdown;
  return {
    pageCount: pages.length,
    pages,
    text,
    markdown: body,
    tokens: countTokens(body, "o200k").count,
    emptyPages,
  };
}
