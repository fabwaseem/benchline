import { describe, expect, it } from "vitest";
import { contrastPair, convertColor, flattenOver } from "@/tools/color-converter/lib/color";

describe("color converter", () => {
  it("converts hex into rgb, hsl, oklch, cmyk, and a Tailwind token", () => {
    const red = convertColor("#ff0000");
    expect(red).toEqual({
      hex: "#ff0000",
      rgb: "rgb(255, 0, 0)",
      hsl: "hsl(0, 100%, 50%)",
      oklch: "oklch(62.80% 0.2577 29.23)",
      cmyk: "cmyk(0%, 100%, 100%, 0%)",
      tailwind: "red-500",
    });
    expect(convertColor("rebeccapurple")?.hex).toBe("#663399");
    expect(convertColor("#000000")?.cmyk).toBe("cmyk(0%, 0%, 0%, 100%)");
    expect(convertColor("#ffffff")?.cmyk).toBe("cmyk(0%, 0%, 0%, 0%)");
    expect(convertColor("#ffffff")?.tailwind).toBe("white");
    expect(convertColor("#000")?.tailwind).toBe("black");
    expect(convertColor("#2563eb")?.tailwind).toBe("blue-600");
  });

  it("accepts rgb, hsl, oklch, and cmyk text", () => {
    expect(convertColor("rgb(255 0 0)")?.hex).toBe("#ff0000");
    expect(convertColor("hsl(0 100% 50%)")?.hex).toBe("#ff0000");
    expect(convertColor("oklch(62.8% 0.2577 29.23)")?.hex).toBe("#ff0000");
    expect(convertColor("cmyk(0%, 100%, 100%, 0%)")?.hex).toBe("#ff0000");
    expect(convertColor("cmyk(0, 1, 1, 0)")?.hex).toBe("#ff0000");
    expect(convertColor("not a color")).toBeNull();
    expect(convertColor("   ")).toBeNull();
  });

  it("reports WCAG contrast for normal and large text", () => {
    const black = contrastPair("#000000", "#ffffff");
    expect(black?.ratioText).toBe("21:1");
    expect(black?.aaNormal).toBe(true);
    expect(black?.aaaNormal).toBe(true);
    const same = contrastPair("#ffffff", "#fff");
    expect(same?.ratio).toBe(1);
    expect(same?.aaLarge).toBe(false);
    const boundary = contrastPair("#767676", "#ffffff");
    expect(boundary?.aaNormal).toBe(true);
    const fail = contrastPair("#777777", "#ffffff");
    expect(fail?.aaNormal).toBe(false);
    expect(fail?.aaLarge).toBe(true);
    const red = contrastPair("#ff0000", "#ffffff");
    expect(red?.aaNormal).toBe(false);
    expect(red?.aaLarge).toBe(true);
    expect(contrastPair("nope", "#fff")).toBeNull();
  });

  it("flattens translucent foregrounds before measuring contrast", () => {
    expect(flattenOver("rgba(0, 0, 0, 0.5)", "#ffffff")).toBe("#808080");
    const report = contrastPair("rgba(0, 0, 0, 0.5)", "#ffffff");
    expect(report?.foreground).toBe("#808080");
    expect(report?.ratio).toBeLessThan(21);
    expect(report?.ratio).toBeGreaterThan(3);
  });
});
