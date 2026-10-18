import { describe, expect, it } from "vitest";
import { analyzeSitemap, generateSitemap } from "@/tools/sitemap-validator/lib/sitemap";

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc><lastmod>2026-01-01</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>http://127.0.0.1/secret</loc><lastmod>nope</lastmod></url>
  <url><loc>https://example.com/</loc><lastmod>2099-01-01</lastmod></url>
</urlset>`;

describe("analyzeSitemap", () => {
  it("counts URLs and flags private, duplicate, and bad lastmod values", () => {
    const report = analyzeSitemap(xml, new Date("2026-10-18T00:00:00.000Z"));
    expect(report).toMatchObject({ kind: "urlset", urlCount: 3 });
    if ("error" in report) return;
    expect(report.issues.some((issue) => issue.detail.includes("private"))).toBe(true);
    expect(report.issues.some((issue) => issue.label === "lastmod" && issue.level === "fail")).toBe(true);
    expect(report.issues.some((issue) => issue.label === "Duplicate")).toBe(true);
    expect(report.issues.some((issue) => issue.detail.includes("future"))).toBe(true);
  });

  it("reads an index and generates a urlset", () => {
    const index = analyzeSitemap("<sitemapindex><sitemap><loc>https://example.com/a.xml</loc></sitemap></sitemapindex>");
    expect(index).toMatchObject({ kind: "index", sitemapCount: 1 });
    const generated = generateSitemap(["https://example.com/docs"], new Date("2026-10-18T00:00:00.000Z"));
    expect(generated).toMatchObject({ report: { kind: "urlset", urlCount: 1 } });
    if ("error" in generated) return;
    expect(generated.xml).toContain("<loc>https://example.com/docs</loc>");
    expect(generated.xml).toContain("<lastmod>2026-10-18</lastmod>");
  });
});
