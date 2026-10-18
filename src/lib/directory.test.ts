import { describe, expect, it } from "vitest";
import {
  categoryFaqs,
  filterDirectory,
  orderCategories,
  parseDirectorySearch,
  serializeDirectorySearch,
  type DirectoryTool,
} from "@/lib/directory";

const tools: DirectoryTool[] = [
  {
    slug: "pdf-merge",
    name: "Merge PDF",
    tagline: "Combine PDFs",
    description: "Join PDF files",
    category: "pdf",
    categoryName: "PDF",
    hue: 12,
    tags: ["pdf"],
    keywords: ["merge"],
    status: "stable",
    icon: "FileText",
    runsLocally: true,
    updatedAt: "2026-10-01",
    createdAt: "2026-09-01",
    mcpName: "merge_pdf",
    popularity: 2,
  },
  {
    slug: "json-formatter",
    name: "JSON formatter",
    tagline: "Format JSON",
    description: "Pretty print JSON",
    category: "developer",
    categoryName: "Developer",
    hue: 200,
    tags: ["json"],
    keywords: ["format"],
    status: "new",
    icon: "Braces",
    runsLocally: true,
    updatedAt: "2026-10-18",
    createdAt: "2026-10-18",
    mcpName: "format_json",
    popularity: 0,
  },
  {
    slug: "ai-seo-checker",
    name: "AI SEO checker",
    tagline: "Score a URL",
    description: "Fetch a public page",
    category: "ai-search",
    categoryName: "AI search",
    hue: 185,
    tags: ["seo"],
    keywords: ["crawler"],
    status: "stable",
    icon: "Bot",
    runsLocally: false,
    updatedAt: "2026-10-10",
    createdAt: "2026-08-01",
    mcpName: null,
    popularity: 1,
  },
];

const base = { query: "", category: "all", tag: "all", browser: false, mcp: false, fresh: false, sort: "popular" as const };

describe("filterDirectory", () => {
  it("filters by query, category, tag, browser, mcp, and new", () => {
    expect(filterDirectory(tools, { ...base, query: "json" }).map((tool) => tool.slug)).toEqual(["json-formatter"]);
    expect(filterDirectory(tools, { ...base, category: "pdf", tag: "pdf" }).map((tool) => tool.slug)).toEqual(["pdf-merge"]);
    expect(filterDirectory(tools, { ...base, browser: true }).map((tool) => tool.slug)).toEqual(["json-formatter", "pdf-merge"]);
    expect(filterDirectory(tools, { ...base, mcp: true }).map((tool) => tool.slug)).toEqual(["json-formatter", "pdf-merge"]);
    expect(filterDirectory(tools, { ...base, fresh: true }).map((tool) => tool.slug)).toEqual(["json-formatter"]);
  });

  it("sorts by popularity, name, and newest", () => {
    expect(filterDirectory(tools, base).map((tool) => tool.slug)).toEqual(["json-formatter", "ai-seo-checker", "pdf-merge"]);
    expect(filterDirectory(tools, { ...base, sort: "az" }).map((tool) => tool.slug)).toEqual(["ai-seo-checker", "json-formatter", "pdf-merge"]);
    expect(filterDirectory(tools, { ...base, sort: "newest" }).map((tool) => tool.slug)).toEqual(["json-formatter", "pdf-merge", "ai-seo-checker"]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterDirectory(tools, { ...base, query: "nope" })).toEqual([]);
  });
});

describe("directory search params", () => {
  it("round-trips filters and omits defaults", () => {
    const parsed = parseDirectorySearch(new URLSearchParams("q=pdf&browser=1&mcp=1&new=1&sort=az&view=list&tag=pdf"));
    expect(parsed).toEqual({
      query: "pdf",
      tag: "pdf",
      browser: true,
      mcp: true,
      fresh: true,
      sort: "az",
      view: "list",
    });
    expect(serializeDirectorySearch(parsed, "grid")).toBe("q=pdf&tag=pdf&browser=1&mcp=1&new=1&sort=az&view=list");
    expect(serializeDirectorySearch({ ...parsed, view: "grid", sort: "popular", tag: "all", browser: false, mcp: false, fresh: false, query: "  " }, "grid")).toBe("");
  });
});

describe("orderCategories", () => {
  it("puts the curated categories first and keeps unknown ones after", () => {
    expect(orderCategories([{ slug: "nextjs" }, { slug: "pdf" }, { slug: "extra" }]).map((item) => item.slug)).toEqual([
      "pdf",
      "nextjs",
      "extra",
    ]);
  });
});

describe("categoryFaqs", () => {
  it("describes local tools and names an MCP tool", () => {
    const faqs = categoryFaqs({ name: "PDF", total: 4, local: 4, sampleMcp: "merge_pdf" });
    expect(faqs[0]?.a).toContain("stay on this device");
    expect(faqs[1]?.a).toContain("merge_pdf");
    expect(categoryFaqs({ name: "AI search", total: 3, local: 1, sampleMcp: null })[0]?.a).toContain("1 of 3");
  });
});
