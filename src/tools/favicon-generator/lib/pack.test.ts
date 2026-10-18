import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { drawMark, inkCount } from "@/tools/favicon-generator/lib/mark";
import { encodeIco, faviconPngs, htmlSnippet, manifestJson, nextMetadataSnippet } from "@/tools/favicon-generator/lib/pack";

describe("favicon pack", () => {
  it("draws a letter and wraps PNGs in an ICO", async () => {
    const color = { r: 255, g: 255, b: 255 };
    const background = { r: 17, g: 17, b: 17 };
    const pixels = drawMark("B", background, color, 64);
    expect(inkCount(pixels, color)).toBeGreaterThan(20);
    const png = new Uint8Array(await sharp(pixels, { raw: { width: 64, height: 64, channels: 4 } }).resize(16, 16).png().toBuffer());
    const ico = encodeIco([{ size: 16, png }]);
    expect(ico[2]).toBe(1);
    expect(ico[4]).toBe(1);
    expect(ico[0]).toBe(0);
    const manifest = JSON.parse(manifestJson("Bench \"line")) as { name: string; icons: { sizes: string }[] };
    expect(manifest.name).toBe("Bench line");
    expect(manifest.icons).toHaveLength(2);
    expect(htmlSnippet()).toMatch(/favicon\.ico/);
    expect(nextMetadataSnippet()).toMatch(/apple-touch-icon/);
    expect(faviconPngs.map((file) => file.size)).toEqual([16, 32, 48, 180, 192, 512]);
  });
});
