import { describe, expect, it } from "vitest";
import {
  capBox,
  clampQuality,
  encoderQuality,
  extensionFor,
  formatBytes,
  isHeic,
  mimeFor,
  outputFilename,
  resolveOutput,
  savings,
  sniffFormat,
} from "@/lib/image-format";

describe("image formats", () => {
  it("sniffs extensions and mime types, including HEIC", () => {
    expect(sniffFormat("Photo.HEIC", "")).toBe("heic");
    expect(sniffFormat("scan.heif", "application/octet-stream")).toBe("heic");
    expect(sniffFormat("a.jpg", "image/jpeg")).toBe("jpeg");
    expect(sniffFormat("a.bin", "image/png")).toBe("png");
    expect(sniffFormat("pic.webp", "")).toBe("webp");
    expect(sniffFormat("pic.AVIF", "")).toBe("avif");
    expect(sniffFormat("anim.gif", "")).toBe("gif");
    expect(sniffFormat("notes.txt", "text/plain")).toBe("unknown");
    expect(isHeic("IMG_1.heic", "")).toBe(true);
    expect(isHeic("IMG_1.jpg", "image/jpeg")).toBe(false);
  });

  it("names the converted file and its mime", () => {
    expect(outputFilename("IMG_2048.HEIC", "jpeg")).toBe("IMG_2048.jpg");
    expect(outputFilename("shot.webp", "png")).toBe("shot.png");
    expect(outputFilename("plain", "avif")).toBe("plain.avif");
    expect(outputFilename("  ", "webp")).toBe("image.webp");
    expect(extensionFor("jpeg")).toBe("jpg");
    expect(mimeFor("jpeg")).toBe("image/jpeg");
    expect(mimeFor("webp")).toBe("image/webp");
  });

  it("keeps a browser format when the choice is original", () => {
    expect(resolveOutput("png", "original")).toBe("png");
    expect(resolveOutput("heic", "original")).toBe("jpeg");
    expect(resolveOutput("gif", "webp")).toBe("webp");
    expect(resolveOutput("unknown", "original")).toBe("jpeg");
  });

  it("clamps quality and reports savings", () => {
    expect(clampQuality(0)).toBe(1);
    expect(clampQuality(80.4)).toBe(80);
    expect(clampQuality(Number.NaN)).toBe(80);
    expect(encoderQuality(75)).toBe(0.75);
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(980)).toBe("980 B");
    expect(formatBytes(1536)).toBe("1.50 KB");
    expect(formatBytes(2_500_000)).toBe("2.38 MB");
    expect(savings(1000, 250)).toEqual({ savedBytes: 750, savedPercent: 75, label: "75% smaller" });
    expect(savings(1000, 1800).label).toBe("80% larger");
    expect(savings(0, 10).label).toBe("0% smaller");
  });

  it("caps the long edge and leaves smaller images alone", () => {
    expect(capBox(4000, 2000, 1000)).toEqual({ width: 1000, height: 500 });
    expect(capBox(800, 600, 2000)).toEqual({ width: 800, height: 600 });
    expect(capBox(800, 600, null)).toEqual({ width: 800, height: 600 });
    expect(capBox(0, 10, 100)).toEqual({ width: 1, height: 10 });
  });
});
