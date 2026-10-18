import { orderCategories, type DirectoryTool } from "@/lib/directory";
import { allTags, categories, tools } from "@/registry";
import { toolOrder } from "@/registry/categories";
import { mcpFor } from "@/registry/mcp-index";

export type DirectoryCategory = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  hue: number;
  count: number;
};

export function directoryCatalog() {
  const rank = new Map<string, number>(toolOrder.map((slug, index) => [slug, index]));
  const hue = new Map<string, number>(categories.map((category) => [category.slug, category.hue]));
  const name = new Map<string, string>(categories.map((category) => [category.slug, category.name]));
  const records: DirectoryTool[] = tools.map((tool) => ({
    slug: tool.slug,
    name: tool.name,
    tagline: tool.tagline,
    description: tool.description,
    category: tool.category,
    categoryName: name.get(tool.category) ?? tool.category,
    hue: hue.get(tool.category) ?? 30,
    tags: tool.tags,
    keywords: tool.keywords,
    status: tool.status,
    icon: tool.icon,
    runsLocally: tool.runsLocally,
    updatedAt: tool.updatedAt,
    createdAt: tool.createdAt,
    mcpName: mcpFor(tool.slug)?.name ?? null,
    popularity: rank.get(tool.slug) ?? toolOrder.length,
  }));
  const nav: DirectoryCategory[] = orderCategories(categories).map((category) => ({
    slug: category.slug,
    name: category.name,
    description: category.description,
    icon: category.icon,
    hue: category.hue,
    count: records.filter((tool) => tool.category === category.slug).length,
  }));
  return { tools: records, categories: nav, tags: allTags() };
}
