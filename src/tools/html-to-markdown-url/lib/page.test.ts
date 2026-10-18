import { describe, expect, it } from "vitest";
import { pageToMarkdown } from "@/tools/html-to-markdown-url/lib/page";
import { markdownFromUrl } from "@/tools/html-to-markdown-url/remote";

const page = `<!doctype html><html lang="en"><head><title>Example page title</title></head>
<body><nav>Skip</nav><h1>Example</h1><p>A public example page used by the Benchline checker for agents.</p>
<script>alert(1)</script></body></html>`;

describe("pageToMarkdown", () => {
  it("keeps the article and drops the script", () => {
    const result = pageToMarkdown(page, "https://1.1.1.1/");
    expect(result.title).toMatch(/Example/);
    expect(result.markdown).toMatch(/public example page/);
    expect(result.markdown.toLowerCase()).not.toContain("alert");
    expect(result.markdown.toLowerCase()).not.toContain("skip");
    expect(result.tokens).toBeGreaterThan(0);
    expect(result.chars).toBe(result.markdown.length);
  });
});

describe("markdownFromUrl", () => {
  it("refuses a private address before fetching", async () => {
    await expect(markdownFromUrl("http://127.0.0.1/x")).rejects.toThrow(/public|private|address/i);
  });
});
