import { unzipSync } from "fflate";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { imageName, packImages, scaleForDpi } from "@/tools/pdf-to-image/lib/plan";
import { renderPdfPages } from "@/tools/pdf-to-image/lib/render-server";

describe("render plan", () => {
  it("maps dpi to a pdf.js scale and names files", () => {
    expect(scaleForDpi(144)).toBe(2);
    expect(imageName("Notes 1.pdf", 2, "jpeg")).toBe("Notes-1-2.jpg");
    expect(() => scaleForDpi(300)).toThrow(/72/);
  });

  it("zips more than one image", () => {
    const zip = packImages([
      { name: "a.png", bytes: Uint8Array.of(1, 2), width: 1, height: 1 },
      { name: "b.png", bytes: Uint8Array.of(3), width: 1, height: 1 },
    ]);
    expect(zip).not.toBeNull();
    expect(Object.keys(unzipSync(zip!)).sort()).toEqual(["a.png", "b.png"]);
    expect(packImages([{ name: "a.png", bytes: Uint8Array.of(1), width: 1, height: 1 }])).toBeNull();
  });
});

describe("renderPdfPages", () => {
  it("draws selectable text into a PNG", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([240, 120]);
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    page.drawText("HELLO", { x: 24, y: 48, size: 36, font, color: rgb(0, 0, 0) });
    const result = await renderPdfPages(new Uint8Array(await doc.save()), {
      format: "png",
      dpi: 72,
      range: "1",
      quality: 82,
      stem: "hello.pdf",
    });
    expect(result.pageCount).toBe(1);
    expect(result.images).toHaveLength(1);
    expect(result.images[0]?.name).toBe("hello-1.png");
    expect(result.zip).toBeNull();
    const bytes = result.images[0]?.bytes ?? new Uint8Array();
    expect([...bytes.slice(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
    expect(bytes.byteLength).toBeGreaterThan(500);
  });
});
