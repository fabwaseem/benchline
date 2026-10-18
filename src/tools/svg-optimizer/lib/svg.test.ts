import { optimize } from "svgo";
import { describe, expect, it } from "vitest";
import { defaultSvgOptions, svgConfig, svgSavings, textBytes } from "@/tools/svg-optimizer/lib/svg";

const source = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10">
  <!-- marker -->
  <rect width="10.0000" height="10.0000" fill="#ffffff"/>
</svg>`;

describe("svg optimizer", () => {
  it("drops comments and shortens numbers while keeping the viewBox", () => {
    const result = optimize(source, svgConfig(defaultSvgOptions()));
    expect(result.data).not.toMatch(/marker/);
    expect(result.data).toMatch(/viewBox/);
    expect(result.data).not.toMatch(/10\.0000/);
    const saved = svgSavings(source, result.data);
    expect(saved.afterBytes).toBeLessThan(saved.beforeBytes);
    expect(textBytes(result.data)).toBe(saved.afterBytes);
  });

  it("can remove the viewBox when asked", () => {
    const options = defaultSvgOptions();
    options.removeViewBox = true;
    const result = optimize(source, svgConfig(options));
    expect(result.data).not.toMatch(/viewBox/);
  });
});
