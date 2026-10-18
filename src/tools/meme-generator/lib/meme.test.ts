import { describe, expect, it } from "vitest";
import {
  bottomCaptionY,
  captionDragBounds,
  captionFontPx,
  clampOffset,
  isImageMime,
  memeFileName,
  memeStyle,
  normalizeCaption,
  splitCaptionLines,
  topCaptionY,
} from "./meme";

describe("meme styles", () => {
  it("resolves a style by id and falls back", () => {
    expect(memeStyle("ocean").name).toBe("Ocean");
    expect(memeStyle("nope").id).toBe("sunset");
  });
});

describe("captions", () => {
  it("normalizes and uppercases", () => {
    expect(normalizeCaption("  hello\r\n", true)).toBe("HELLO");
    expect(normalizeCaption("  hello\r\n", false)).toBe("hello");
  });

  it("splits lines", () => {
    expect(splitCaptionLines("one\ntwo\n\nthree")).toEqual(["one", "two", "three"]);
    expect(splitCaptionLines("   ")).toEqual([""]);
  });

  it("scales font with width", () => {
    expect(captionFontPx(1000, 1)).toBe(85);
    expect(captionFontPx(1000, 1.5)).toBe(128);
    expect(captionFontPx(100, 0.5)).toBe(16);
  });

  it("positions captions", () => {
    expect(topCaptionY(1000, 0)).toBe(40);
    expect(topCaptionY(1000, 25)).toBe(65);
    expect(bottomCaptionY(1000, 200, 0)).toBe(760);
    expect(bottomCaptionY(1000, 200, -30)).toBe(730);
  });

  it("clamps drag offsets", () => {
    expect(clampOffset(999, -10, 10)).toBe(10);
    expect(clampOffset(-999, -10, 10)).toBe(-10);
    expect(clampOffset(5, -10, 10)).toBe(5);
  });

  it("computes drag bounds", () => {
    const bounds = captionDragBounds(1000, 200);
    expect(bounds.min).toBeLessThan(0);
    expect(bounds.max).toBeGreaterThan(0);
    expect(bounds.min).toBe(-bounds.max);
  });
});

describe("helpers", () => {
  it("builds a file name", () => {
    expect(memeFileName(new Date("2024-01-01T00:00:00Z"))).toMatch(/^meme-[a-z0-9]+\.png$/);
  });

  it("detects image mimes", () => {
    expect(isImageMime("image/png")).toBe(true);
    expect(isImageMime("IMAGE/JPEG")).toBe(true);
    expect(isImageMime("application/pdf")).toBe(false);
  });
});
