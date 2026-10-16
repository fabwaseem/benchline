import { ICON_NAMES } from "@/lib/icons";
import { categorySchema, toolMetaSchema, type Category, type ToolMeta } from "@/registry/schema";

const iconNames = new Set(ICON_NAMES);

export function assertRegistry(metas: unknown[], cats: unknown[], order: readonly string[]): ToolMeta[] {
  const categories = cats.map((category) => categorySchema.parse(category));
  const tools = metas.map((meta) => toolMetaSchema.parse(meta));
  const categorySlugs = new Set<string>();

  for (const category of categories) {
    if (categorySlugs.has(category.slug)) {
      throw new Error(`Duplicate category ${category.slug}`);
    }
    categorySlugs.add(category.slug);
    if (!iconNames.has(category.icon)) {
      throw new Error(`Unknown icon ${category.icon} on category ${category.slug}`);
    }
    if (category.hue >= 25 && category.hue <= 60) {
      throw new Error(`Category ${category.slug} uses a reserved orange hue`);
    }
  }

  const slugs = new Set<string>();
  for (const tool of tools) {
    if (slugs.has(tool.slug)) throw new Error(`Duplicate slug ${tool.slug}`);
    slugs.add(tool.slug);
    if (!categorySlugs.has(tool.category)) {
      throw new Error(`Unknown category ${tool.category} on ${tool.slug}`);
    }
    if (!iconNames.has(tool.icon)) {
      throw new Error(`Unknown icon ${tool.icon} on ${tool.slug}`);
    }
  }

  for (const tool of tools) {
    for (const related of tool.related) {
      if (!slugs.has(related)) {
        throw new Error(`Unknown related tool ${related} on ${tool.slug}`);
      }
    }
    const tags = new Set<string>();
    for (const tag of tool.tags) {
      if (tags.has(tag)) throw new Error(`Duplicate tag ${tag} on ${tool.slug}`);
      tags.add(tag);
    }
  }

  if (order.length !== tools.length || order.some((slug) => !slugs.has(slug))) {
    throw new Error("toolOrder must list every tool slug once");
  }

  const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));
  return order.map((slug) => {
    const tool = bySlug.get(slug);
    if (!tool) throw new Error(`Missing tool ${slug}`);
    return tool;
  });
}

export function categoryBySlug(categories: Category[], slug: string) {
  return categories.find((category) => category.slug === slug);
}
