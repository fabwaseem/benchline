import { describe, expect, it } from "vitest";
import { markdownRewrite } from "@/lib/net/negotiate";

describe("markdownRewrite", () => {
  it("sends an agent asking for Markdown to the Markdown copy", () => {
    expect(markdownRewrite("/t/jwt-decoder", "GET", "text/markdown")).toBe("/md/jwt-decoder");
    expect(markdownRewrite("/t/jwt-decoder", "HEAD", "text/markdown, text/plain;q=0.8")).toBe("/md/jwt-decoder");
    expect(markdownRewrite("/t/jwt-decoder", "GET", "text/markdown, text/html;q=0.9")).toBe("/md/jwt-decoder");
  });

  it("leaves browsers and plain fetches on the HTML page", () => {
    expect(markdownRewrite("/t/jwt-decoder", "GET", "text/html,application/xhtml+xml,*/*;q=0.8")).toBeNull();
    expect(markdownRewrite("/t/jwt-decoder", "GET", "*/*")).toBeNull();
    expect(markdownRewrite("/t/jwt-decoder", "GET", null)).toBeNull();
    expect(markdownRewrite("/t/jwt-decoder", "GET", "text/html, text/markdown")).toBeNull();
  });

  it("only applies to GET or HEAD on a tool page", () => {
    expect(markdownRewrite("/t/jwt-decoder", "POST", "text/markdown")).toBeNull();
    expect(markdownRewrite("/tools", "GET", "text/markdown")).toBeNull();
    expect(markdownRewrite("/t/jwt-decoder/extra", "GET", "text/markdown")).toBeNull();
  });
});
