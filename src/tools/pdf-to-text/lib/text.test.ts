import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { extractPdfText } from "@/tools/pdf-to-text/lib/extract";
import { glyphsToLines, linesToMarkdown, pageFromItems } from "@/tools/pdf-to-text/lib/text";

describe("pdf text lines", () => {
  it("joins glyphs on one baseline and marks a larger line as a heading", () => {
    const lines = glyphsToLines([
      { text: "Body", x: 10, y: 100, size: 12 },
      { text: "line", x: 40, y: 100, size: 12 },
      { text: "Title", x: 10, y: 140, size: 24 },
    ]);
    expect(lines.map((line) => line.text)).toEqual(["Title", "Body line"]);
    expect(linesToMarkdown(lines)).toBe("# Title\n\nBody line");
  });

  it("ignores items that are not text", () => {
    expect(pageFromItems([{ type: "beginMarkedContent" }, { str: "Only", transform: [12, 0, 0, 12, 0, 0], height: 12 }]).text).toBe("Only");
  });
});

describe("extractPdfText", () => {
  it("reads selectable text and a heading from a PDF", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([400, 300]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.drawText("Chapter", { x: 40, y: 240, size: 28, font, color: rgb(0, 0, 0) });
    page.drawText("A selectable sentence.", { x: 40, y: 180, size: 12, font });
    const result = await extractPdfText(new Uint8Array(await doc.save()));
    expect(result.pageCount).toBe(1);
    expect(result.text).toContain("Chapter");
    expect(result.text).toContain("A selectable sentence.");
    expect(result.markdown).toMatch(/^# Chapter/);
    expect(result.tokens).toBeGreaterThan(0);
    expect(result.emptyPages).toBe(0);
  });

  it("says when a page has no text", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([200, 200]);
    const result = await extractPdfText(new Uint8Array(await doc.save()));
    expect(result.emptyPages).toBe(1);
    expect(result.markdown).toMatch(/does not OCR/);
  });
});
