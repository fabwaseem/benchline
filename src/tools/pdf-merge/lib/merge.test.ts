import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { mergePdfs } from "@/tools/pdf-merge/lib/merge";

async function blankPdf(pages: number) {
  const doc = await PDFDocument.create();
  for (let index = 0; index < pages; index += 1) doc.addPage([200, 200]);
  return doc.save();
}

describe("mergePdfs", () => {
  it("joins files in order and honors a page range", async () => {
    const merged = await mergePdfs([
      { name: "a.pdf", data: await blankPdf(2), pages: "2" },
      { name: "b.pdf", data: await blankPdf(1) },
    ]);
    expect(merged.pageCount).toBe(2);
    expect(new TextDecoder().decode(merged.bytes.slice(0, 5))).toBe("%PDF-");
    const reloaded = await PDFDocument.load(merged.bytes);
    expect(reloaded.getPageCount()).toBe(2);
  });

  it("rejects a single file, a non-PDF, and a range past the end", async () => {
    const one = await blankPdf(1);
    await expect(mergePdfs([{ name: "only.pdf", data: one }])).rejects.toThrow(/at least two/);
    await expect(mergePdfs([
      { name: "a.pdf", data: one },
      { name: "notes.txt", data: new Uint8Array([1, 2, 3, 4]) },
    ])).rejects.toThrow(/not a PDF/);
    await expect(mergePdfs([
      { name: "a.pdf", data: one, pages: "2" },
      { name: "b.pdf", data: one },
    ])).rejects.toThrow(/1 page/);
  });
});
