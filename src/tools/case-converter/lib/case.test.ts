import { describe, expect, it } from "vitest";
import { convertAllCases, convertCase } from "@/tools/case-converter/lib/case";

describe("case converter", () => {
  it("builds identifier cases per line", () => {
    expect(convertCase("hello world", "camel")).toBe("helloWorld");
    expect(convertCase("hello world", "pascal")).toBe("HelloWorld");
    expect(convertCase("hello world", "snake")).toBe("hello_world");
    expect(convertCase("hello world", "constant")).toBe("HELLO_WORLD");
    expect(convertCase("hello world", "kebab")).toBe("hello-world");
    expect(convertCase("hello world\nfoo bar", "camel")).toBe("helloWorld\nfooBar");
  });

  it("applies AP and Chicago title case", () => {
    expect(convertCase("the old man and the sea", "title-ap")).toBe("The Old Man and the Sea");
    expect(convertCase("notes from the underground", "title-ap")).toBe("Notes From the Underground");
    expect(convertCase("notes from the underground", "title-chicago")).toBe("Notes from the Underground");
    expect(convertCase("a tale of two cities", "title-chicago")).toBe("A Tale of Two Cities");
  });

  it("alternates and inverts letters without touching digits", () => {
    expect(convertCase("hello", "alternating")).toBe("HeLlO");
    expect(convertCase("Hello 2", "inverse")).toBe("hELLO 2");
    expect(convertCase("Café", "upper")).toBe("CAFÉ");
  });

  it("returns every style", () => {
    const all = convertAllCases("hello");
    expect(all).toHaveLength(16);
    expect(all.map((item) => item.style)).toContain("train");
    expect(all.find((item) => item.style === "dot")?.text).toBe("hello");
  });
});
