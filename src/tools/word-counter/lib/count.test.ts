import { describe, expect, it } from "vitest";
import { countText } from "@/tools/word-counter/lib/count";

describe("word counter", () => {
  it("counts words, graphemes, and sentences", () => {
    const counts = countText("Hello, world. Café!");
    expect(counts.words).toBe(3);
    expect(counts.sentences).toBe(2);
    expect(counts.characters).toBe(Array.from("Hello, world. Café!").length);
    expect(counts.graphemes).toBe([...new Intl.Segmenter("en", { granularity: "grapheme" }).segment("Hello, world. Café!")].length);
    expect(counts.charactersNoSpaces).toBe(17);
    expect(counts.uniqueWords).toBe(3);
    expect(counts.paragraphs).toBe(1);
  });

  it("treats an emoji sequence as one grapheme and two code points when it is a ZWJ pair", () => {
    const family = "👩‍👩‍👧";
    const counts = countText(family);
    expect(counts.words).toBe(0);
    expect(counts.graphemes).toBe(1);
    expect(counts.characters).toBeGreaterThan(1);
  });

  it("splits paragraphs on blank lines and marks platform limits", () => {
    const counts = countText("One.\n\nTwo.");
    expect(counts.paragraphs).toBe(2);
    expect(counts.lines).toBe(3);
    const title = counts.platforms.find((platform) => platform.id === "seo-title");
    expect(title?.over).toBe(false);
    const long = countText("a".repeat(61));
    expect(long.platforms.find((platform) => platform.id === "seo-title")?.over).toBe(true);
    expect(long.platforms.find((platform) => platform.id === "meta-description")?.over).toBe(false);
  });

  it("returns zeros for empty text", () => {
    const counts = countText("");
    expect(counts.words).toBe(0);
    expect(counts.readingLabel).toBe("0 sec");
    expect(counts.lines).toBe(0);
    expect(counts.platforms.every((platform) => platform.count === 0 && !platform.over)).toBe(true);
  });
});
