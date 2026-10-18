import { describe, expect, it } from "vitest";
import { compressionPlan } from "@/tools/image-compress/lib/compress";

describe("image compress", () => {
  it("keeps the original format, caps the long edge, and reports savings", () => {
    const plan = compressionPlan({
      filename: "photo.png",
      mime: "image/png",
      choice: "original",
      quality: 80,
      sourceWidth: 4000,
      sourceHeight: 2000,
      maxEdge: 1600,
      beforeBytes: 2_000_000,
      afterBytes: 500_000,
    });
    expect(plan.format).toBe("png");
    expect(plan.quality).toBe(80);
    expect(plan.width).toBe(1600);
    expect(plan.height).toBe(800);
    expect(plan.savedBytes).toBe(1_500_000);
    expect(plan.label).toBe("75% smaller");
  });

  it("falls HEIC back to JPEG and clamps a bad quality value", () => {
    const plan = compressionPlan({
      filename: "IMG.heic",
      mime: "",
      choice: "original",
      quality: 400,
      sourceWidth: 800,
      sourceHeight: 600,
      maxEdge: null,
      beforeBytes: 100,
      afterBytes: 140,
    });
    expect(plan.source).toBe("heic");
    expect(plan.format).toBe("jpeg");
    expect(plan.quality).toBe(100);
    expect(plan.width).toBe(800);
    expect(plan.label).toBe("40% larger");
  });

  it("honors an explicit target format", () => {
    expect(compressionPlan({
      filename: "a.png",
      mime: "image/png",
      choice: "webp",
      quality: 60,
      sourceWidth: 10,
      sourceHeight: 10,
      maxEdge: 0,
      beforeBytes: 10,
      afterBytes: 4,
    }).format).toBe("webp");
  });
});
