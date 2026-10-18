import { describe, expect, it } from "vitest";
import { exampleCss, exampleHtml, exampleJs, minifyCode } from "./minify";

describe("minifyCode", () => {
  it("minifies JavaScript and reports savings", async () => {
    const result = await minifyCode("js", exampleJs);
    expect(result.error).toBeUndefined();
    expect(result.afterBytes).toBeLessThan(result.beforeBytes);
    expect(result.savedPct).toBeGreaterThan(0);
    expect(result.code).not.toContain("\n");
  });

  it("respects the mangle toggle", async () => {
    const mangled = await minifyCode("js", "function helloWorld(myArgument) { return myArgument; }", { jsMangle: true });
    const kept = await minifyCode("js", "function helloWorld(myArgument) { return myArgument; }", { jsMangle: false });
    expect(mangled.error).toBeUndefined();
    expect(kept.error).toBeUndefined();
    expect(mangled.code).not.toContain("myArgument");
    expect(kept.code).toContain("myArgument");
  });

  it("reports JavaScript syntax errors", async () => {
    const result = await minifyCode("js", "function ( {");
    expect(result.error).toBeTruthy();
    expect(result.code).toBe("function ( {");
  });

  it("minifies CSS", async () => {
    const result = await minifyCode("css", exampleCss);
    expect(result.error).toBeUndefined();
    expect(result.afterBytes).toBeLessThan(result.beforeBytes);
    expect(result.code).toContain(".card{");
  });

  it("minifies HTML", async () => {
    const result = await minifyCode("html", exampleHtml);
    expect(result.error).toBeUndefined();
    expect(result.afterBytes).toBeLessThan(result.beforeBytes);
    expect(result.code).not.toContain("<!--");
    expect(result.code).toContain("<!doctype html>");
  });

  it("keeps whitespace inside pre blocks", async () => {
    const result = await minifyCode("html", "<div>  <pre>  keep\n  me  </pre>  </div>");
    expect(result.error).toBeUndefined();
    expect(result.code).toContain("<pre>  keep\n  me  </pre>");
    expect(result.code).not.toContain("<div>  <pre>");
  });

  it("drops optional closing tags in aggressive mode", async () => {
    const plain = await minifyCode("html", "<ul><li>a</li><li>b</li></ul><p>hi</p>");
    const aggressive = await minifyCode("html", "<ul><li>a</li><li>b</li></ul><p>hi</p>", { htmlAggressive: true });
    expect(plain.code).toContain("</li>");
    expect(aggressive.code).not.toContain("</li>");
    expect(aggressive.code).not.toContain("</p>");
  });

  it("rejects empty input", async () => {
    const result = await minifyCode("js", "   ");
    expect(result.error).toBeTruthy();
  });
});
