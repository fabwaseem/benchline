import type { SearchRecord, ToolMeta } from "@/registry/schema";

export function asRecord(tool: ToolMeta): SearchRecord {
  return {
    slug: tool.slug,
    name: tool.name,
    tagline: tool.tagline,
    description: tool.description,
    category: tool.category,
    tags: [...tool.tags],
    keywords: [...tool.keywords],
    status: tool.status,
    icon: tool.icon,
    runsLocally: tool.runsLocally,
  };
}
