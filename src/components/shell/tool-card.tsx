import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "kineticons";
import { Cover } from "@/components/site/cover";
import { Tag } from "@/components/kit/tag";
import type { DirectoryTool } from "@/lib/directory";

export function ToolCard({ tool }: { tool: DirectoryTool }) {
  return (
    <Link
      href={`/t/${tool.slug}`}
      className="ki-trigger lift group relative flex h-full flex-col gap-4 rounded-xl border border-border bg-surface p-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className="flex items-start justify-between gap-3">
        <Cover hue={tool.hue} icon={tool.icon} size={40} />
        <ArrowUpRight
          size={16}
          aria-hidden
          className="text-faint opacity-0 transition-[opacity,transform,color] duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-text group-hover:opacity-100 group-focus-visible:opacity-100"
        />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-semibold tracking-[-0.02em]">{tool.name}</span>
        <span className="mt-1 line-clamp-2 block text-[13px] leading-5 text-muted-foreground">{tool.tagline}</span>
      </span>
      <span className="mt-auto flex flex-wrap gap-1.5">
        <Tag>{tool.categoryName}</Tag>
        {tool.mcpName ? <Tag>MCP</Tag> : null}
        {tool.status === "new" ? <Tag className="bg-brand-wash text-brand-text">New</Tag> : null}
      </span>
    </Link>
  );
}

export function ToolRow({ tool }: { tool: DirectoryTool }) {
  return (
    <Link
      href={`/t/${tool.slug}`}
      className="ki-trigger group flex items-center gap-3 px-3 py-3 transition-colors duration-150 hover:bg-raised focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
    >
      <Cover hue={tool.hue} icon={tool.icon} size={36} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-semibold tracking-[-0.02em]">{tool.name}</span>
        <span className="block truncate text-[13px] text-muted-foreground">{tool.tagline}</span>
      </span>
      {tool.status === "new" ? <Tag className="hidden bg-brand-wash text-brand-text sm:inline-flex">New</Tag> : null}
      <span className="hidden font-mono text-[12px] text-faint md:inline">{tool.slug}</span>
      <ChevronRight size={16} className="text-faint transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-brand-text" aria-hidden />
    </Link>
  );
}
