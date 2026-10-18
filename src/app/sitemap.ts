import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { indexableCategorySlugs } from "@/lib/taxonomy";
import { allTags, tools } from "@/registry";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/explore"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/categories"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/ai"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/mcp"), changeFrequency: "monthly", priority: 0.6 },
  ];
  for (const category of indexableCategorySlugs()) {
    pages.push({
      url: absoluteUrl(`/${category}`),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }
  for (const tag of allTags()) {
    pages.push({
      url: absoluteUrl(`/tags/${tag.slug}`),
      changeFrequency: "weekly",
      priority: 0.5,
    });
  }
  for (const tool of tools) {
    pages.push({
      url: absoluteUrl(`/t/${tool.slug}`),
      lastModified: tool.updatedAt,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }
  return pages;
}
