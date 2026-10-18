import { describe, expect, it } from "vitest";
import { coverCrop, presetById, SOCIAL_PRESETS } from "./social";

describe("SOCIAL_PRESETS", () => {
  it("holds eight platform presets", () => {
    expect(SOCIAL_PRESETS).toHaveLength(8);
    expect(presetById("instagram-story")).toMatchObject({ width: 1080, height: 1920 });
  });

  it("looks up presets by id", () => {
    expect(presetById("youtube-thumbnail")?.label).toBe("YouTube thumbnail");
    expect(presetById("nope")).toBeUndefined();
  });
});

describe("coverCrop", () => {
  it("crops a wide photo to a square from the center", () => {
    expect(coverCrop(1920, 1080, 1080, 1080, 0.5, 0.5)).toEqual({ sx: 420, sy: 0, sw: 1080, sh: 1080 });
  });

  it("crops a wide photo to a portrait from the center", () => {
    expect(coverCrop(1600, 900, 1080, 1350, 0.5, 0.5)).toEqual({ sx: 440, sy: 0, sw: 720, sh: 900 });
  });

  it("keeps a tall photo whole for a matching story frame", () => {
    expect(coverCrop(720, 1280, 1080, 1920, 0.5, 0.5)).toEqual({ sx: 0, sy: 0, sw: 720, sh: 1280 });
  });

  it("shifts the crop rect with the focal point", () => {
    expect(coverCrop(1920, 1080, 1080, 1080, 0, 0.5).sx).toBe(0);
    expect(coverCrop(1920, 1080, 1080, 1080, 1, 0.5).sx).toBe(840);
  });

  it("clamps the focal point to the source edges", () => {
    expect(coverCrop(1920, 1080, 1080, 1920, -1, 0.5).sx).toBe(0);
    expect(coverCrop(1920, 1080, 1080, 1920, 2, 0.5).sx).toBe(1312);
    expect(coverCrop(1920, 1080, 1080, 1080, 0.5, 99).sy).toBe(0);
    expect(coverCrop(1920, 1080, 1080, 1080, 0.5, -99).sy).toBe(0);
  });

  it("keeps the rect inside the source after rounding", () => {
    const rect = coverCrop(1920, 1080, 1080, 1920, 1, 1);
    expect(rect.sx + rect.sw).toBeLessThanOrEqual(1920);
    expect(rect.sy + rect.sh).toBeLessThanOrEqual(1080);
    expect(rect.sx).toBeGreaterThanOrEqual(0);
    expect(rect.sy).toBeGreaterThanOrEqual(0);
  });

  it("throws on non-positive dimensions", () => {
    expect(() => coverCrop(0, 100, 100, 100)).toThrow();
    expect(() => coverCrop(100, -5, 100, 100)).toThrow();
    expect(() => coverCrop(100, 100, 0, 100)).toThrow();
    expect(() => coverCrop(100, 100, 100, Number.NaN)).toThrow();
  });
});
