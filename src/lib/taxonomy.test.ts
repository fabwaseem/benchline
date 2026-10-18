import { describe, expect, it } from "vitest";
import { tools } from "@/registry";
import { categoryParams, indexableCategorySlugs, navEntries, resolveListing } from "@/lib/taxonomy";

describe("taxonomy", () => {
  it("shows one sidebar entry per parent that has tools, and flattens a single child", () => {
    const nav = navEntries();
    expect(nav.map((entry) => entry.name)).toEqual([
      "Developer",
      "Data & Formats",
      "SEO & AI Search",
      "Image & Media",
      "PDF & Documents",
      "Security & Crypto",
      "Design",
      "Text",
      "Math & Finance",
      "Network",
    ]);
    expect(nav.find((entry) => entry.name === "Image & Media")).toMatchObject({ slug: "image", flat: true, children: [] });
    expect(nav.find((entry) => entry.name === "PDF & Documents")).toMatchObject({ slug: "pdf", flat: true });
    expect(nav.find((entry) => entry.name === "Design")).toMatchObject({ slug: "design", flat: true });
    expect(nav.find((entry) => entry.name === "Text")).toMatchObject({ slug: "text", flat: false });
    expect(nav.find((entry) => entry.name === "Math & Finance")).toMatchObject({ slug: "math", flat: false });
    expect(nav.find((entry) => entry.name === "Network")).toMatchObject({ slug: "urls", flat: true });
    const data = nav.find((entry) => entry.slug === "data");
    expect(data?.children.map((child) => child.slug)).toEqual(["json", "tables", "encoding", "markup", "sql"]);
    expect(nav.find((entry) => entry.slug === "text")?.children.map((child) => child.slug)).toEqual(["diff", "writing"]);
    expect(nav.find((entry) => entry.slug === "math")?.children.map((child) => child.slug)).toEqual(["time", "finance", "units"]);
    expect(nav.reduce((sum, entry) => sum + entry.count, 0)).toBe(tools.length);
  });

  it("keeps subcategory pages and redirects a parent that has one child", () => {
    const seo = resolveListing("seo");
    expect(seo?.kind).toBe("page");
    if (seo?.kind !== "page") return;
    expect(seo.breadcrumbs.map((item) => item.label)).toEqual(["Tools", "SEO & AI Search", "SEO"]);
    expect(seo.chips?.map((chip) => chip.slug)).toEqual(["ai-search", "seo", "ai-dev", "social"]);
    expect(seo.hue).toBe(255);

    const parent = resolveListing("seo-ai");
    expect(parent?.kind).toBe("page");
    if (parent?.kind !== "page") return;
    expect(parent.filter).toBe("seo-ai");
    expect(parent.chips?.length).toBe(4);

    expect(resolveListing("media")).toEqual({ kind: "redirect", href: "/image" });
    expect(resolveListing("documents")).toEqual({ kind: "redirect", href: "/pdf" });
    const math = resolveListing("math");
    expect(math?.kind).toBe("page");
    if (math?.kind === "page") expect(math.chips?.map((chip) => chip.slug)).toEqual(["time", "finance", "units"]);
    const text = resolveListing("text");
    expect(text?.kind).toBe("page");
    if (text?.kind === "page") expect(text.chips?.map((chip) => chip.slug)).toEqual(["diff", "writing"]);
    expect(resolveListing("network")).toEqual({ kind: "redirect", href: "/urls" });

    const image = resolveListing("image");
    expect(image?.kind).toBe("page");
    if (image?.kind !== "page") return;
    expect(image.name).toBe("Image & Media");
    expect(image.chips).toBeNull();
    expect(image.breadcrumbs.map((item) => item.label)).toEqual(["Tools", "Image & Media"]);

    const design = resolveListing("design");
    expect(design?.kind).toBe("page");
    if (design?.kind !== "page") return;
    expect(design.chips).toBeNull();
    expect(design.name).toBe("Design");
  });

  it("publishes a route for every child and every parent", () => {
    const params = categoryParams().map((item) => item.category);
    expect(params).toContain("json");
    expect(params).toContain("data");
    expect(params).toContain("media");
    expect(new Set(params).size).toBe(params.length);
    const indexable = indexableCategorySlugs();
    expect(indexable).toContain("data");
    expect(indexable).toContain("image");
    expect(indexable).not.toContain("media");
    for (const tool of tools) {
      const listing = resolveListing(tool.category);
      expect(listing?.kind).toBe("page");
    }
  });
});
