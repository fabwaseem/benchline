import { deflateSync } from "node:zlib";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import {
  placeSignatures,
  placementRect,
  smoothStroke,
  type Point,
  type SignaturePlacement,
} from "@/tools/pdf-signature/lib/signature";

async function blankPdf(pages: number) {
  const doc = await PDFDocument.create();
  for (let index = 0; index < pages; index += 1) doc.addPage([400, 600]);
  return doc.save();
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const body = new Uint8Array([...typeBytes, ...data]);
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set(typeBytes, 4);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(body));
  return out;
}

/** A tiny 2x1 red PNG, built in-memory so the test needs no fixture file. */
function tinyPng(): Uint8Array {
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, 2);
  view.setUint32(4, 1);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const raw = new Uint8Array([0, 255, 0, 0, 255, 0, 0]);
  const idat = new Uint8Array(deflateSync(raw));
  return new Uint8Array([
    137, 80, 78, 71, 13, 10, 26, 10,
    ...pngChunk("IHDR", ihdr),
    ...pngChunk("IDAT", idat),
    ...pngChunk("IEND", new Uint8Array(0)),
  ]);
}

function placement(overrides: Partial<SignaturePlacement> = {}): SignaturePlacement {
  return { page: 1, x: 0.1, y: 0.7, width: 0.3, ...overrides };
}

describe("smoothStroke", () => {
  it("returns [] for an empty stroke and a single point", () => {
    expect(smoothStroke([])).toEqual([]);
    expect(smoothStroke([{ x: 5, y: 5 }])).toEqual([]);
  });

  it("keeps collinear points on the line", () => {
    const line: Point[] = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ];
    const smoothed = smoothStroke(line);
    expect(smoothed.length).toBeGreaterThan(line.length);
    for (const point of smoothed) {
      expect(Math.abs(point.y - point.x)).toBeLessThan(1e-9);
    }
    expect(smoothed[0]).toEqual({ x: 0, y: 0 });
    expect(smoothed[smoothed.length - 1]).toEqual({ x: 2, y: 2 });
  });

  it("cuts a sharp corner instead of passing through it", () => {
    const corner: Point[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ];
    const smoothed = smoothStroke(corner);
    expect(smoothed.length).toBe(6);
    expect(smoothed.some((point) => point.x === 1 && point.y === 0)).toBe(false);
    expect(smoothed[0]).toEqual({ x: 0, y: 0 });
    expect(smoothed[smoothed.length - 1]).toEqual({ x: 1, y: 1 });
  });
});

describe("placementRect", () => {
  it("converts fractions to PDF coordinates with a flipped y", () => {
    const rect = placementRect(600, 800, 2, { page: 1, x: 0.5, y: 0.25, width: 0.5 });
    expect(rect.width).toBe(300);
    expect(rect.height).toBe(150);
    expect(rect.x).toBe(300);
    // y is measured from the top in the placement, so the PDF y is
    // pageHeight - y*pageHeight - signatureHeight = 800 - 200 - 150.
    expect(rect.y).toBe(450);
  });

  it("throws descriptive errors for out-of-range values", () => {
    expect(() => placementRect(600, 800, 2, placement({ page: 0 }))).toThrow(/page number/);
    expect(() => placementRect(600, 800, 2, placement({ page: 1.5 }))).toThrow(/page number/);
    expect(() => placementRect(600, 800, 2, placement({ x: -0.1 }))).toThrow(/placement x/i);
    expect(() => placementRect(600, 800, 2, placement({ x: 1.2 }))).toThrow(/placement x/i);
    expect(() => placementRect(600, 800, 2, placement({ y: -0.01 }))).toThrow(/placement y/i);
    expect(() => placementRect(600, 800, 2, placement({ width: 0 }))).toThrow(/placement width/i);
    expect(() => placementRect(600, 800, 2, placement({ width: 1.5 }))).toThrow(/placement width/i);
    expect(() => placementRect(-1, 800, 2, placement())).toThrow(/page width/i);
  });
});

describe("placeSignatures", () => {
  it("draws the signature on the placed pages and returns a valid PDF", async () => {
    const pdf = await blankPdf(2);
    const result = await placeSignatures(pdf, tinyPng(), [
      placement({ page: 1 }),
      placement({ page: 2, x: 0.5, y: 0.1, width: 0.2 }),
    ]);
    expect(result.pageCount).toBe(2);
    expect(new TextDecoder().decode(result.bytes.slice(0, 5))).toBe("%PDF-");
    const reloaded = await PDFDocument.load(result.bytes);
    expect(reloaded.getPageCount()).toBe(2);
  });

  it("rejects non-PNG signature bytes with a friendly error", async () => {
    const pdf = await blankPdf(1);
    await expect(placeSignatures(pdf, new Uint8Array([1, 2, 3, 4]), [placement()])).rejects.toThrow(
      /signature must be a PNG/i,
    );
  });

  it("rejects placements past the end of the document", async () => {
    const pdf = await blankPdf(2);
    await expect(placeSignatures(pdf, tinyPng(), [placement({ page: 5 })])).rejects.toThrow(/past the end/);
    await expect(placeSignatures(pdf, tinyPng(), [])).rejects.toThrow(/at least one/);
  });
});
