import fs from "node:fs/promises";
import { PDFDocument, StandardFonts } from "pdf-lib";
import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderPdfPages } from "@/tools/pdf-to-image/lib/render-server";

async function helveticaPdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  doc.addPage([400, 120]).drawText("BENCHLINE", { x: 20, y: 40, size: 48, font });
  return new Uint8Array(await doc.save());
}

describe("renderPdfPages on the server", () => {
  afterEach(() => vi.restoreAllMocks());

  it("loads pdf.js standard font data instead of relying on system fonts", async () => {
    const read = vi.spyOn(fs, "readFile");
    const out = await renderPdfPages(await helveticaPdf(), { format: "png", dpi: 72, range: "", quality: 90 });
    await Promise.allSettled(read.mock.results.map((result) => result.value));
    const loaded = read.mock.calls.filter(([file], index) => String(file).includes("standard_fonts") && read.mock.settledResults[index]?.type === "fulfilled");
    expect(loaded.length).toBeGreaterThan(0);
    const stats = await sharp(Buffer.from(out.images[0]!.bytes)).stats();
    expect(stats.channels[0]!.min).toBeLessThan(64);
  }, 60_000);
});
