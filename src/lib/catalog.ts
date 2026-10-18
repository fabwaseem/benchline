import type { DirectoryTool } from "@/lib/directory";
import { navEntries, parentHue, parentSlugOf, type ChildLink } from "@/lib/taxonomy";
import { allTags, categories, tools } from "@/registry";
import { parents, toolOrder } from "@/registry/categories";
import { mcpFor } from "@/registry/mcp-index";

export type DirectoryCategory = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  hue: number;
  count: number;
  flat: boolean;
  match: string[];
  children: ChildLink[];
};

export function directoryCatalog() {
  const rank = new Map<string, number>(toolOrder.map((slug, index) => [slug, index]));
  const name = new Map<string, string>(categories.map((category) => [category.slug, category.name]));
  const parentName = new Map<string, string>(parents.map((parent) => [parent.slug, parent.name]));
  const records: DirectoryTool[] = tools.map((tool) => ({
    slug: tool.slug,
    name: tool.name,
    tagline: tool.tagline,
    description: tool.description,
    category: tool.category,
    categoryName: name.get(tool.category) ?? tool.category,
    parent: parentSlugOf(tool.category),
    parentName: parentName.get(parentSlugOf(tool.category)) ?? tool.category,
    hue: parentHue(tool.category),
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
  const nav: DirectoryCategory[] = navEntries();
  return { tools: records, categories: nav, tags: allTags() };
}
