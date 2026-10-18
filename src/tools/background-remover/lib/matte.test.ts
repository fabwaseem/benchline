import { describe, expect, it } from "vitest";
import { parseHexColor, removeSolidBackground } from "@/tools/background-remover/lib/matte";

function paint(width: number, height: number, fill: (x: number, y: number) => [number, number, number, number]) {
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a] = fill(x, y);
      const index = (y * width + x) * 4;
      pixels[index] = r;
      pixels[index + 1] = g;
      pixels[index + 2] = b;
      pixels[index + 3] = a;
    }
  }
  return pixels;
}

function alpha(pixels: Uint8Array, width: number, x: number, y: number) {
  return pixels[(y * width + x) * 4 + 3];
}

describe("solid background matte", () => {
  it("clears a white border and keeps an interior red square", () => {
    const pixels = paint(20, 16, (x, y) => (x >= 6 && x < 14 && y >= 4 && y < 12 ? [200, 20, 20, 255] : [255, 255, 255, 255]));
    const out = removeSolidBackground(pixels, 20, 16, { tolerance: 24, feather: false, color: null });
    expect(alpha(out, 20, 0, 0)).toBe(0);
    expect(alpha(out, 20, 19, 15)).toBe(0);
    expect(alpha(out, 20, 9, 7)).toBe(255);
    expect(out[(7 * 20 + 9) * 4]).toBe(200);
  });

  it("keeps a white interior that does not touch the border", () => {
    const pixels = paint(12, 12, (x, y) => {
      if (x >= 3 && x < 9 && y >= 3 && y < 9) return [250, 250, 250, 255];
      return [20, 90, 40, 255];
    });
    const out = removeSolidBackground(pixels, 12, 12, { tolerance: 30, feather: false, color: { r: 20, g: 90, b: 40 } });
    expect(alpha(out, 12, 0, 0)).toBe(0);
    expect(alpha(out, 12, 5, 5)).toBe(255);
  });

  it("parses hex colors", () => {
    expect(parseHexColor("#abc")).toEqual({ r: 170, g: 187, b: 204 });
    expect(parseHexColor("112233")).toEqual({ r: 17, g: 34, b: 51 });
    expect(parseHexColor("nope")).toBeNull();
  });
});
