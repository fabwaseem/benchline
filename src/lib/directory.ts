export type DirectorySort = "popular" | "az" | "newest";
export type DirectoryView = "grid" | "list";

export type DirectoryTool = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  categoryName: string;
  hue: number;
  tags: readonly string[];
  keywords: readonly string[];
  status: "stable" | "beta" | "new" | "deprecated";
  icon: string;
  runsLocally: boolean;
  updatedAt: string;
  createdAt: string;
  mcpName: string | null;
  popularity: number;
};

export type DirectoryFilters = {
  query: string;
  category: string;
  tag: string;
  browser: boolean;
  mcp: boolean;
  fresh: boolean;
  sort: DirectorySort;
};

export type DirectorySearch = {
  query: string;
  tag: string;
  browser: boolean;
  mcp: boolean;
  fresh: boolean;
  sort: DirectorySort;
  view: DirectoryView | null;
};

export const sidebarCategoryOrder = [
  "pdf",
  "image",
  "design",
  "developer",
  "auth",
  "seo",
  "ai-search",
  "ai-dev",
  "social",
  "nextjs",
] as const;

export function orderCategories<T extends { slug: string }>(categories: readonly T[]): T[] {
  const rank = new Map<string, number>(sidebarCategoryOrder.map((slug, index) => [slug, index]));
  return [...categories].sort(
    (a, b) => (rank.get(a.slug) ?? 99) - (rank.get(b.slug) ?? 99) || a.slug.localeCompare(b.slug),
  );
}

export function filterDirectory<T extends DirectoryTool>(tools: readonly T[], filters: DirectoryFilters): T[] {
  const needle = filters.query.trim().toLowerCase();
  const rows = tools.filter((tool) => {
    if (filters.category !== "all" && tool.category !== filters.category) return false;
    if (filters.tag !== "all" && !tool.tags.includes(filters.tag)) return false;
    if (filters.browser && !tool.runsLocally) return false;
    if (filters.mcp && !tool.mcpName) return false;
    if (filters.fresh && tool.status !== "new") return false;
    if (!needle) return true;
    const haystack = [tool.name, tool.tagline, tool.description, tool.slug, tool.categoryName, tool.tags.join(" "), tool.keywords.join(" ")]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
  return [...rows].sort((a, b) => {
    if (filters.sort === "az") return a.name.localeCompare(b.name);
    if (filters.sort === "newest") {
      return b.createdAt.localeCompare(a.createdAt) || b.updatedAt.localeCompare(a.updatedAt) || a.name.localeCompare(b.name);
    }
    return a.popularity - b.popularity || a.name.localeCompare(b.name);
  });
}

function readFlag(params: URLSearchParams, key: string) {
  return params.get(key) === "1";
}

export function parseDirectorySearch(params: URLSearchParams): DirectorySearch {
  const sort = params.get("sort");
  const view = params.get("view");
  return {
    query: params.get("q") ?? "",
    tag: params.get("tag") ?? "all",
    browser: readFlag(params, "browser"),
    mcp: readFlag(params, "mcp"),
    fresh: readFlag(params, "new"),
    sort: sort === "az" || sort === "newest" ? sort : "popular",
    view: view === "grid" || view === "list" ? view : null,
  };
}

export function serializeDirectorySearch(search: DirectorySearch, defaultView: DirectoryView): string {
  const params = new URLSearchParams();
  const query = search.query.trim();
  if (query) params.set("q", query);
  if (search.tag !== "all") params.set("tag", search.tag);
  if (search.browser) params.set("browser", "1");
  if (search.mcp) params.set("mcp", "1");
  if (search.fresh) params.set("new", "1");
  if (search.sort !== "popular") params.set("sort", search.sort);
  if (search.view && search.view !== defaultView) params.set("view", search.view);
  return params.toString();
}

export function categoryFaqs(input: {
  name: string;
  total: number;
  local: number;
  sampleMcp: string | null;
}): { q: string; a: string }[] {
  const files =
    input.local === input.total
      ? `Every ${input.name} tool runs in the browser. Files and text you enter stay on this device.`
      : input.local === 0
        ? `${input.name} tools can fetch a public URL you submit. They do not upload a file unless the tool says so.`
        : `${input.local} of ${input.total} ${input.name} tools run entirely in the browser. The others fetch only the public URL you submit.`;
  const agent = input.sampleMcp
    ? `Yes. Each one is on the Benchline MCP server. One of the tool names is ${input.sampleMcp}.`
    : "Yes. Each one is on the Benchline MCP server at /mcp.";
  return [
    { q: "Do my files leave my device?", a: files },
    { q: "Can AI agents use these tools?", a: agent },
  ];
}
