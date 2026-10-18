import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { recognizeImage } from "@/tools/ocr-image-to-text/lib/recognize";

describe("ocr engine", () => {
  it("reads a large word from a rendered image", async () => {
    const png = new Uint8Array(await sharp(Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="160"><rect width="100%" height="100%" fill="white"/><text x="24" y="110" font-size="96" font-family="DejaVu Sans, sans-serif" fill="black">HELLO</text></svg>`,
    )).png().toBuffer());
    const result = await recognizeImage(png, "eng");
    expect(result.text).toMatch(/HELLO/);
    expect(result.confidence).toBeGreaterThan(80);
    expect(result.language).toBe("eng");
  }, 30_000);
});
