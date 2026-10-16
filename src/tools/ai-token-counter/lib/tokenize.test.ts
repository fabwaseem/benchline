import { describe, expect, it } from "vitest";
import { countTokens } from "@/tools/ai-token-counter/lib/tokenize";

describe("countTokens", () => {
  it("counts a known word and keeps the preview joined to the source", () => {
    const result = countTokens("hello world", "o200k", 20);
    expect(result.count).toBeGreaterThan(0);
    expect(result.words).toBe(2);
    expect(result.segments.join("")).toBe("hello world");
    expect(countTokens("", "cl100k").count).toBe(0);
  });
});
