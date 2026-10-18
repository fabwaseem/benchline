import { describe, expect, it } from "vitest";
import { conversionPlan } from "@/tools/image-convert/lib/convert";

describe("image convert", () => {
  it("plans a HEIC to JPEG conversion", () => {
    expect(conversionPlan("IMG_2048.HEIC", "", "jpeg")).toEqual({
      source: "heic",
      heic: true,
      filename: "IMG_2048.jpg",
      mime: "image/jpeg",
      extension: "jpg",
    });
  });

  it("plans webp to png and png to jpeg from the mime when the name is generic", () => {
    expect(conversionPlan("upload.bin", "image/webp", "png")).toMatchObject({ source: "webp", filename: "upload.png", mime: "image/png" });
    expect(conversionPlan("scan.png", "image/png", "jpeg")).toMatchObject({ source: "png", filename: "scan.jpg", heic: false });
    expect(conversionPlan("photo.jpg", "image/jpeg", "avif").extension).toBe("avif");
  });
});
