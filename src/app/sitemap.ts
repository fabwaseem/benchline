import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { allTags, categories, tools } from "@/registry";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.4 },
  ];
  for (const category of categories) {
    pages.push({
      url: absoluteUrl(`/${category.slug}`),
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
