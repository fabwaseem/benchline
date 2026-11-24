import { describe, expect, it } from "vitest";
import { TITLE_BUDGET, toolMarkdownPath, toolTitle } from "@/lib/seo";

describe("toolTitle", () => {
  it("adds search intent to a short title", () => {
    expect(toolTitle("JWT decoder")).toBe("JWT decoder: free online tool");
  });

  it("keeps a title that already says free or online", () => {
    expect(toolTitle("Free PDF merge")).toBe("Free PDF merge");
    expect(toolTitle("Online cron builder")).toBe("Online cron builder");
  });

  it("never pushes the full title past the budget", () => {
    const long = "Next.js Dockerfile and compose file generator";
    const title = toolTitle(long);
    expect(title).toBe(long);
    expect(`${toolTitle("JWT decoder")} · Benchline`.length).toBeLessThanOrEqual(TITLE_BUDGET);
  });

  it("trims whitespace", () => {
    expect(toolTitle("  Hash generator ")).toBe("Hash generator: free online tool");
  });
});

describe("toolMarkdownPath", () => {
  it("points at the .md copy of the tool page", () => {
    expect(toolMarkdownPath("jwt-decoder")).toBe("/t/jwt-decoder.md");
  });
});
