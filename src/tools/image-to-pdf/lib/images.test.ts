import { deflateSync } from "node:zlib";
import { encode } from "jpeg-js";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { imagesToPdf, layoutImage, PAGE_POINTS } from "@/tools/image-to-pdf/lib/images";

function jpeg(width: number, height: number) {
  const data = new Uint8Array(width * height * 4);
  for (let index = 0; index < data.length; index += 4) {
    data[index] = index % 255;
    data[index + 1] = 40;
    data[index + 2] = 80;
    data[index + 3] = 255;
  }
  return new Uint8Array(encode({ data, width, height }, 80).data);
}

function pngChunk(type: string, data: Buffer) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([length, body, checksum]);
}

function crc32(data: Buffer) {
  let crc = -1;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return crc ^ -1;
}

function png(width: number, height: number) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * (width * 4 + 1) + 1 + x * 4;
      raw[index] = 20;
      raw[index + 1] = 90;
      raw[index + 2] = 160;
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

describe("layoutImage", () => {
  it("letterboxes a wide image on a portrait A4 page", () => {
    const layout = layoutImage({ page: "a4", orientation: "portrait", margin: 0, imageWidth: 1000, imageHeight: 500 });
    expect(layout.pageWidth).toBe(PAGE_POINTS.a4.width);
    expect(layout.pageHeight).toBe(PAGE_POINTS.a4.height);
    expect(layout.x).toBe(0);
    expect(layout.width).toBe(PAGE_POINTS.a4.width);
    expect(layout.height).toBeLessThan(layout.pageHeight);
    expect(layout.y).toBeGreaterThan(0);
  });

  it("follows the image for auto orientation and fit", () => {
    const landscape = layoutImage({ page: "a4", orientation: "auto", margin: 0, imageWidth: 1000, imageHeight: 500 });
    expect(landscape.pageWidth).toBe(PAGE_POINTS.a4.height);
    expect(landscape.pageHeight).toBe(PAGE_POINTS.a4.width);
    const fit = layoutImage({ page: "fit", orientation: "auto", margin: 0, imageWidth: 200, imageHeight: 100 });
    expect(fit.pageWidth).toBeGreaterThan(fit.pageHeight);
    const inset = layoutImage({ page: "letter", orientation: "portrait", margin: 36, imageWidth: 400, imageHeight: 400 });
    expect(inset.x).toBeGreaterThanOrEqual(36);
    expect(inset.y).toBeGreaterThanOrEqual(36);
  });
});

describe("imagesToPdf", () => {
  it("keeps image order and page shape", async () => {
    const result = await imagesToPdf(
      [
        { kind: "jpg", data: jpeg(80, 40) },
        { kind: "png", data: png(40, 80) },
      ],
      { page: "fit", orientation: "auto", margin: 0 },
    );
    expect(result.pageCount).toBe(2);
    const doc = await PDFDocument.load(result.bytes);
    expect(doc.getPage(0).getWidth()).toBeGreaterThan(doc.getPage(0).getHeight());
    expect(doc.getPage(1).getHeight()).toBeGreaterThan(doc.getPage(1).getWidth());
  });

  it("rejects an empty list and a file that is not an image", async () => {
    await expect(imagesToPdf([], { page: "a4", orientation: "auto", margin: 0 })).rejects.toThrow(/at least one/);
    await expect(imagesToPdf(
      [{ kind: "png", data: new Uint8Array([1, 2, 3, 4]) }],
      { page: "a4", orientation: "portrait", margin: 12 },
    )).rejects.toThrow(/Image 1/);
  });
});
