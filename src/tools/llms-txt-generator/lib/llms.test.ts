import { describe, expect, it } from "vitest";
import { groupPages, parseSitemapLocs, renderLlmsTxt, sectionFor } from "@/tools/llms-txt-generator/lib/llms";

describe("llms", () => {
  it("groups privacy under Optional and docs under Docs", () => {
    expect(sectionFor("https://example.com/docs/start")).toBe("Docs");
    expect(sectionFor("https://example.com/privacy")).toBe("Optional");
    const file = renderLlmsTxt("Example", "A short site.", [
      { url: "https://example.com/docs/start", title: "Start", description: "Read this first.", excerpt: "" },
      { url: "https://example.com/privacy", title: "Privacy", description: "", excerpt: "" },
    ]);
    expect(file).toContain("## Docs");
    expect(file).toContain("## Optional");
    expect(file.indexOf("## Docs")).toBeLessThan(file.indexOf("## Optional"));
    expect(groupPages([])).toEqual([]);
  });

  it("reads sitemap locations", () => {
    expect(parseSitemapLocs("<urlset><url><loc>https://example.com/a</loc></url></urlset>")).toEqual([
      "https://example.com/a",
    ]);
  });
});
