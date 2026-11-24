import { describe, expect, it } from "vitest";
import { z } from "zod";
import { failureOf, strictInput, textCopy } from "@/lib/mcp/result";

describe("failureOf", () => {
  it("returns the error of an ok:false result", () => {
    expect(failureOf({ ok: false, error: "Unknown currency: XYZ." })).toBe("Unknown currency: XYZ.");
    expect(failureOf({ ok: false, error: "" })).toMatch(/could not/);
  });

  it("ignores successes and validator answers", () => {
    expect(failureOf({ ok: true, error: "" })).toBeNull();
    expect(failureOf({ valid: false, errors: [{ message: "x" }] })).toBeNull();
    expect(failureOf(null)).toBeNull();
    expect(failureOf([{ ok: false }])).toBeNull();
  });
});

describe("textCopy", () => {
  const png = "iVBORw0KGgo".padEnd(4000, "A");

  it("replaces base64 files with a pointer to structuredContent", () => {
    const text = textCopy({ png, width: 10, images: [{ data: `data:image/png;base64,${png}` }] });
    expect(text).not.toContain("AAAA");
    expect(text).toContain("structuredContent.png");
    expect(text).toContain("structuredContent.images[0].data");
    expect(JSON.parse(text).width).toBe(10);
  });

  it("keeps short strings and real text", () => {
    const markdown = "# Title\n\n" + "Some words here. ".repeat(200);
    expect(JSON.parse(textCopy({ id: "abc", markdown })).markdown).toBe(markdown);
  });
});

describe("strictInput", () => {
  it("rejects unknown keys and keeps known ones", () => {
    const schema = strictInput(z.object({ action: z.enum(["encode", "decode"]).default("encode") }));
    expect(schema.parse({ action: "decode" })).toEqual({ action: "decode" });
    expect(() => schema.parse({ mode: "decode" })).toThrow(/mode/);
  });
});
