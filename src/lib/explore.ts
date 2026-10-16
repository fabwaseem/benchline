export type ExploreSort = "name" | "updated" | "category";

export type ExploreTool = {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  tags: readonly string[];
  updatedAt: string;
  icon: string;
};

export type ExploreQuery = {
  query: string;
  category: string;
  tag: string;
  sort: ExploreSort;
};

export function exploreTools<T extends ExploreTool>(
  tools: readonly T[],
  query: ExploreQuery,
  categoryName: (slug: string) => string = (slug) => slug,
): T[] {
  const needle = query.query.trim().toLowerCase();
  const rows = tools.filter((tool) => {
    if (query.category !== "all" && tool.category !== query.category) return false;
    if (query.tag !== "all" && !tool.tags.includes(query.tag)) return false;
    if (!needle) return true;
    const haystack = `${tool.name} ${tool.tagline} ${tool.slug} ${tool.tags.join(" ")}`.toLowerCase();
    return haystack.includes(needle);
  });
  return [...rows].sort((a, b) => {
    if (query.sort === "updated") return b.updatedAt.localeCompare(a.updatedAt) || a.name.localeCompare(b.name);
    if (query.sort === "category") {
      const byCategory = categoryName(a.category).localeCompare(categoryName(b.category));
      return byCategory || a.name.localeCompare(b.name);
    }
    return a.name.localeCompare(b.name);
  });
}
