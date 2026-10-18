import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { assertPlan, nextTurn, organizePdf } from "@/tools/pdf-rotate-organize/lib/organize";

async function twoPages() {
  const doc = await PDFDocument.create();
  doc.addPage([200, 100]);
  doc.addPage([300, 100]);
  return new Uint8Array(await doc.save());
}

describe("page plan", () => {
  it("steps rotation by a quarter turn", () => {
    expect(nextTurn(0)).toBe(90);
    expect(nextTurn(270)).toBe(0);
  });

  it("rejects a page that is not in the file", () => {
    expect(() => assertPlan([{ source: 3, rotate: 0 }], 2)).toThrow(/outside/);
    expect(() => assertPlan([], 2)).toThrow(/at least one/);
  });
});

describe("organizePdf", () => {
  it("reorders pages and applies rotation", async () => {
    const result = await organizePdf(await twoPages(), [
      { source: 2, rotate: 90 },
      { source: 1, rotate: 180 },
    ]);
    const doc = await PDFDocument.load(result.bytes);
    expect(result.pageCount).toBe(2);
    expect(doc.getPage(0).getSize().width).toBe(300);
    expect(doc.getPage(0).getRotation().angle).toBe(90);
    expect(doc.getPage(1).getRotation().angle).toBe(180);
  });

  it("allows the same source page more than once", async () => {
    const result = await organizePdf(await twoPages(), [
      { source: 1, rotate: 0 },
      { source: 1, rotate: 0 },
    ]);
    expect(result.pageCount).toBe(2);
  });
});
