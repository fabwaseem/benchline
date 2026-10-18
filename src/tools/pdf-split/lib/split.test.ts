import { unzipSync } from "fflate";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { groupPages, safeStem, splitPdf } from "@/tools/pdf-split/lib/split";

async function blankPdf(pages: number) {
  const doc = await PDFDocument.create();
  for (let index = 0; index < pages; index += 1) doc.addPage([200, 200]);
  return doc.save();
}

describe("groupPages", () => {
  it("extracts one group, one page each, or chunks of N", () => {
    expect(groupPages([1, 2, 4], "extract", 2)).toEqual([[1, 2, 4]]);
    expect(groupPages([5, 1], "pages", 2)).toEqual([[5], [1]]);
    expect(groupPages([1, 2, 3, 4, 5], "chunks", 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("rejects a chunk size that is not a whole number", () => {
    expect(() => groupPages([1], "chunks", 0)).toThrow(/whole number/);
    expect(() => groupPages([1], "chunks", 1.5)).toThrow(/whole number/);
  });
});

describe("safeStem", () => {
  it("strips the extension and unsafe characters", () => {
    expect(safeStem("My report.pdf")).toBe("My-report");
    expect(safeStem("...")).toBe("document");
  });
});

describe("splitPdf", () => {
  it("extracts a range into one PDF", async () => {
    const result = await splitPdf(await blankPdf(3), { range: "1-2,3", mode: "extract", every: 1, name: "scan.pdf" });
    expect(result.files).toHaveLength(1);
    expect(result.files[0]?.name).toBe("scan-extract.pdf");
    expect(result.zip).toBeNull();
    expect((await PDFDocument.load(result.files[0]?.bytes ?? new Uint8Array())).getPageCount()).toBe(3);
  });

  it("writes one PDF per page and a zip", async () => {
    const result = await splitPdf(await blankPdf(3), { range: "1,3", mode: "pages", every: 1, name: "scan.pdf" });
    expect(result.files.map((file) => file.name)).toEqual(["scan-page-1.pdf", "scan-page-3.pdf"]);
    expect(result.zip).not.toBeNull();
    const unzipped = unzipSync(result.zip ?? new Uint8Array());
    expect(Object.keys(unzipped).sort()).toEqual(["scan-page-1.pdf", "scan-page-3.pdf"]);
  });

  it("splits the selection into chunks", async () => {
    const result = await splitPdf(await blankPdf(5), { range: "", mode: "chunks", every: 2, name: "scan.pdf" });
    expect(result.files).toHaveLength(3);
    const counts = await Promise.all(result.files.map(async (file) => (await PDFDocument.load(file.bytes)).getPageCount()));
    expect(counts).toEqual([2, 2, 1]);
  });
});
