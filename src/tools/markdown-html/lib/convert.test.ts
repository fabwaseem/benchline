import { describe, expect, it } from "vitest";
import { cleanHtml, htmlToMarkdown, markdownToHtml } from "@/tools/markdown-html/lib/convert";

describe("markdown html", () => {
  it("renders GFM and strips scripts when sanitize is on", () => {
    const html = markdownToHtml("# Hi\n\n<script>alert(1)</script>\n\n| a | b |\n| - | - |\n| 1 | 2 |", true);
    expect(html).toContain("<h1");
    expect(html).toContain("<table");
    expect(html.toLowerCase()).not.toContain("<script");
  });

  it("keeps raw HTML when sanitize is off", () => {
    const html = markdownToHtml("<script>alert(1)</script>", false);
    expect(html.toLowerCase()).toContain("<script");
  });

  it("turns HTML into markdown and drops javascript URLs", () => {
    const markdown = htmlToMarkdown('<h1>Hi</h1><p>There</p><a href="javascript:alert(1)">x</a>', true);
    expect(markdown).toContain("# Hi");
    expect(markdown).toContain("There");
    expect(markdown.toLowerCase()).not.toContain("javascript:");
  });

  it("removes event handlers from a preview", () => {
    const clean = cleanHtml('<h1>Hi</h1><img src="https://example.com/a.png" onerror="alert(1)"><a href="javascript:alert(1)">x</a>');
    expect(clean).toContain("<h1>Hi</h1>");
    expect(clean).not.toContain("onerror");
    expect(clean.toLowerCase()).not.toContain("javascript:");
  });
});
