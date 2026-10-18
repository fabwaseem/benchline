import { describe, expect, it } from "vitest";
import { cleanOcrText, ocrLanguage, roundConfidence } from "@/tools/ocr-image-to-text/lib/text";

describe("ocr text", () => {
  it("trims extra space and keeps a paragraph break", () => {
    expect(cleanOcrText(" Hello  \r\n\r\n\r\nworld \n")).toBe("Hello\n\nworld");
  });

  it("accepts known language codes", () => {
    expect(ocrLanguage("eng")).toBe("eng");
    expect(ocrLanguage("jpn")).toBe("jpn");
    expect(() => ocrLanguage("../eng")).toThrow(/supported/);
    expect(roundConfidence(96.4)).toBe(96);
    expect(roundConfidence(Number.NaN)).toBe(0);
  });
});
