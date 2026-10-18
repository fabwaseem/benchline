import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { compressImage, convertImage, resizeImage } from "@/lib/mcp/image";

async function png() {
  return new Uint8Array(await sharp({
    create: { width: 8, height: 4, channels: 3, background: { r: 20, g: 80, b: 160 } },
  }).png().toBuffer());
}

describe("image codecs", () => {
  it("converts, compresses, and resizes pixels", async () => {
    const bytes = await png();
    const converted = await convertImage({ bytes, filename: "wide.png", mime: "image/png", target: "jpeg" });
    expect(converted.mime).toBe("image/jpeg");
    expect(converted.filename).toBe("wide.jpg");
    expect(converted.width).toBe(8);
    expect(converted.height).toBe(4);
    const jpeg = Buffer.from(converted.data, "base64");
    expect(jpeg[0]).toBe(0xff);
    expect(jpeg[1]).toBe(0xd8);

    const compressed = await compressImage({
      bytes,
      filename: "wide.png",
      mime: "image/png",
      choice: "jpeg",
      quality: 40,
      maxEdge: 4,
    });
    expect(compressed.format).toBe("jpeg");
    expect(Math.max(compressed.width, compressed.height)).toBeLessThanOrEqual(4);

    const resized = await resizeImage({
      bytes,
      filename: "wide.png",
      mime: "image/png",
      mode: "pixels",
      width: 3,
      height: 3,
      percent: 100,
      lockAspect: false,
      fit: "cover",
    });
    expect(resized.width).toBe(3);
    expect(resized.height).toBe(3);
    expect(resized.mime).toBe("image/png");
  });

  it("refuses HEIC without decoding it", async () => {
    await expect(convertImage({
      bytes: new Uint8Array([1, 2, 3, 4]),
      filename: "photo.heic",
      mime: "image/heic",
      target: "jpeg",
    })).rejects.toThrow(/HEIC/);
  });
});
