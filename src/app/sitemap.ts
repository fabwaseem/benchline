import type { MetadataRoute } from "next";
import { toolCover } from "@/lib/assets";
import { absoluteUrl } from "@/lib/site";
import { indexableCategorySlugs } from "@/lib/taxonomy";
import { allTags, tools } from "@/registry";

export default function sitemap(): MetadataRoute.Sitemap {
  // The site changes when a tool does: the newest tool update dates the directory pages.
  const latest = tools.reduce((max, tool) => (tool.updatedAt > max ? tool.updatedAt : max), "1970-01-01");
  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: latest, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/tools"), lastModified: latest, changeFrequency: "weekly", priority: 0.95 },
    { url: absoluteUrl("/categories"), lastModified: latest, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/mcp/guide"), lastModified: latest, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/ai"), lastModified: latest, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/explore"), lastModified: latest, changeFrequency: "weekly", priority: 0.5 },
    { url: absoluteUrl("/about"), lastModified: latest, changeFrequency: "monthly", priority: 0.5 },
  ];
  for (const category of indexableCategorySlugs()) {
    pages.push({ url: absoluteUrl(`/${category}`), lastModified: latest, changeFrequency: "weekly", priority: 0.75 });
  }
  for (const tag of allTags()) {
    pages.push({ url: absoluteUrl(`/tags/${tag.slug}`), changeFrequency: "weekly", priority: 0.4 });
  }
  for (const tool of tools) {
    pages.push({
      url: absoluteUrl(`/t/${tool.slug}`),
      lastModified: tool.updatedAt,
      changeFrequency: "monthly",
      priority: 0.9,
      images: [absoluteUrl(toolCover(tool.slug))],
    });
  }
  return pages;
}
