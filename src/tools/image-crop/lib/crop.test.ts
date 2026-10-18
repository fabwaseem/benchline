import { describe, expect, it } from "vitest";
import { aspectRatio, clampCrop } from "@/tools/image-crop/lib/crop";

describe("crop box", () => {
  it("clamps a pixel box into the frame", () => {
    expect(clampCrop(100, 80, { x: -10, y: 70, width: 40, height: 40 }, "px")).toEqual({
      x: 0,
      y: 70,
      width: 40,
      height: 10,
    });
  });

  it("reads a ratio box as a share of the source", () => {
    expect(clampCrop(200, 100, { x: 0.25, y: 0, width: 0.5, height: 1 }, "ratio")).toEqual({
      x: 50,
      y: 0,
      width: 100,
      height: 100,
    });
  });

  it("keeps free aspect unset and maps Open Graph", () => {
    expect(aspectRatio("free")).toBeUndefined();
    expect(aspectRatio("og")).toBeCloseTo(1200 / 630);
  });
});
