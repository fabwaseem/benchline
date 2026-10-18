import { deflateSync } from "node:zlib";
import { decode, encode } from "jpeg-js";
import { PDFDocument, PDFName, PDFRawStream } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { compressPdf, compressionSteps, scaleRgba, undoPngPredictor } from "@/tools/pdf-compress/lib/compress";

function noisyJpeg(width: number, height: number, quality: number) {
  const data = new Uint8Array(width * height * 4);
  let seed = 1;
  for (let index = 0; index < data.length; index += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    data[index] = seed & 255;
    data[index + 1] = (seed >>> 8) & 255;
    data[index + 2] = (seed >>> 16) & 255;
    data[index + 3] = 255;
  }
  return new Uint8Array(encode({ data, width, height }, quality).data);
}

function crc32(data: Buffer) {
  let crc = -1;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return crc ^ -1;
}

function pngChunk(type: string, data: Buffer) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([length, body, checksum]);
}

function noisyPng(width: number, height: number) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  let seed = 7;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const index = y * (width * 4 + 1) + 1 + x * 4;
      raw[index] = seed & 255;
      raw[index + 1] = (seed >>> 8) & 255;
      raw[index + 2] = (seed >>> 16) & 255;
      raw[index + 3] = 255;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return new Uint8Array(Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]));
}

async function pdfWithJpeg() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([400, 400]);
  const image = await doc.embedJpg(noisyJpeg(180, 180, 95));
  page.drawImage(image, { x: 20, y: 20, width: 360, height: 360 });
  doc.setTitle("Secret title");
  doc.setAuthor("Secret author");
  return doc.save();
}

function firstJpeg(bytes: Uint8Array) {
  return PDFDocument.load(bytes).then((doc) => {
    for (const [, object] of doc.context.enumerateIndirectObjects()) {
      if (!(object instanceof PDFRawStream)) continue;
      if (object.dict.lookup(PDFName.of("Subtype")) !== PDFName.of("Image")) continue;
      if (object.dict.lookup(PDFName.of("Filter")) !== PDFName.of("DCTDecode")) continue;
      return object.getContents();
    }
    return null;
  });
}

describe("compressionSteps", () => {
  it("uses one step unless a target size asks for a ladder", () => {
    expect(compressionSteps("light", null)).toEqual([{ quality: 82, scale: 1 }]);
    const ladder = compressionSteps("strong", 100 * 1024);
    expect(ladder[0]).toEqual({ quality: 40, scale: 0.7 });
    expect(ladder.length).toBeGreaterThan(1);
  });
});

describe("image helpers", () => {
  it("reverses a PNG none filter and shrinks a bitmap", () => {
    const samples = undoPngPredictor(new Uint8Array([0, 1, 2, 3, 4, 5, 6]), 2, 3);
    expect([...samples]).toEqual([1, 2, 3, 4, 5, 6]);
    const scaled = scaleRgba(new Uint8Array(8 * 8 * 4).fill(255), 8, 8, 0.5);
    expect(scaled.width).toBe(4);
    expect(scaled.height).toBe(4);
    expect(scaled.data).toHaveLength(4 * 4 * 4);
  });
});

describe("compressPdf", () => {
  it("shrinks a JPEG PDF, keeps the page, and clears the title", async () => {
    const original = await pdfWithJpeg();
    const result = await compressPdf(original, { preset: "strong", targetBytes: null });
    expect(result.after).toBeLessThan(result.before);
    expect(result.recompressed).toBe(1);
    expect(result.pages).toBe(1);
    expect(result.keptOriginal).toBe(false);
    const reloaded = await PDFDocument.load(result.bytes);
    expect(reloaded.getPageCount()).toBe(1);
    expect(reloaded.getTitle()).toBeUndefined();
    expect(reloaded.getAuthor()).toBeUndefined();
    const jpeg = await firstJpeg(result.bytes);
    expect(jpeg).not.toBeNull();
    const decoded = decode(jpeg ?? new Uint8Array(), { useTArray: true, tolerantDecoding: true });
    expect(decoded.width).toBeGreaterThan(0);
  });

  it("recompresses a flate PNG image", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([300, 300]);
    const image = await doc.embedPng(noisyPng(96, 96));
    page.drawImage(image, { x: 10, y: 10, width: 280, height: 280 });
    const original = await doc.save();
    const result = await compressPdf(original, { preset: "medium", targetBytes: null });
    expect(result.images).toBeGreaterThan(0);
    expect(result.recompressed).toBeGreaterThan(0);
    expect(result.after).toBeLessThan(result.before);
    expect((await PDFDocument.load(result.bytes)).getPageCount()).toBe(1);
  });

  it("keeps a text-only PDF that does not shrink and still opens", async () => {
    const doc = await PDFDocument.create();
    doc.addPage();
    const original = await doc.save();
    const result = await compressPdf(original, { preset: "light", targetBytes: 500 * 1024 });
    expect(result.after).toBeLessThanOrEqual(original.byteLength);
    expect(result.pages).toBe(1);
    expect(result.metTarget).toBe(true);
    expect((await PDFDocument.load(result.bytes)).getPageCount()).toBe(1);
  });

  it("rejects a file that is not a PDF", async () => {
    await expect(compressPdf(new Uint8Array([1, 2, 3, 4]), { preset: "light", targetBytes: null })).rejects.toThrow(/not a PDF/);
  });
});
