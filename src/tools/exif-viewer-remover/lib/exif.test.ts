import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { stripJpegGps, stampJpeg } from "@/tools/exif-viewer-remover/lib/gps";
import { readExif } from "@/tools/exif-viewer-remover/lib/read";
import { formatGps, listTags } from "@/tools/exif-viewer-remover/lib/tags";

describe("exif tags", () => {
  it("formats a GPS fix and skips empty values", () => {
    const fix = formatGps(37.77, -122.41);
    expect(fix?.label).toMatch(/37\.77000° N/);
    expect(fix?.label).toMatch(/122\.41000° W/);
    expect(fix?.map).toMatch(/openstreetmap/);
    expect(listTags({ Make: "Bench", junk: "", when: new Date("2026-01-02T03:04:05.000Z") })).toEqual([
      { name: "Make", value: "Bench" },
      { name: "when", value: "2026-01-02T03:04:05.000Z" },
    ]);
  });

  it("reads a stamped JPEG and removes only the GPS block", async () => {
    const plain = new Uint8Array(await sharp({
      create: { width: 8, height: 8, channels: 3, background: { r: 240, g: 80, b: 40 } },
    }).jpeg({ quality: 90 }).toBuffer());
    const stamped = stampJpeg(plain, "Benchline", 37.77, -122.41);
    const before = await readExif(stamped);
    expect(before.camera).toMatch(/Benchline/);
    expect(before.gps?.latitude).toBeCloseTo(37.77, 2);
    const stripped = stripJpegGps(stamped);
    const after = await readExif(stripped);
    expect(after.gps).toBeNull();
    expect(after.camera).toMatch(/Benchline/);
  });
});
