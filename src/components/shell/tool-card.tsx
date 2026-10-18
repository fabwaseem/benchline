import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Cover } from "@/components/site/cover";
import { Tag } from "@/components/kit/tag";
import type { DirectoryTool } from "@/lib/directory";

export function ToolCard({ tool }: { tool: DirectoryTool }) {
  return (
    <Link
      href={`/t/${tool.slug}`}
      className="lift flex h-full flex-col gap-3.5 rounded-xl border border-border bg-surface p-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className="flex items-start gap-3">
        <Cover hue={tool.hue} icon={tool.icon} size={40} />
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-medium tracking-[-0.02em]">{tool.name}</span>
          <span className="mt-0.5 line-clamp-2 block text-[13px] leading-5 text-muted-foreground">{tool.tagline}</span>
        </span>
      </span>
      <span className="mt-auto flex flex-wrap gap-1.5">
        <Tag>{tool.categoryName}</Tag>
        {tool.mcpName ? <Tag>MCP</Tag> : null}
        {tool.status === "new" ? <Tag>New</Tag> : null}
      </span>
    </Link>
  );
}

export function ToolRow({ tool }: { tool: DirectoryTool }) {
  return (
    <Link
      href={`/t/${tool.slug}`}
      className="flex items-center gap-3 px-3 py-3 transition-colors duration-150 hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Cover hue={tool.hue} icon={tool.icon} size={36} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-medium tracking-[-0.02em]">{tool.name}</span>
        <span className="block truncate text-[13px] text-muted-foreground">{tool.tagline}</span>
      </span>
      <span className="hidden font-mono text-[12px] text-faint sm:inline">{tool.slug}</span>
      <ChevronRight size={16} className="text-faint" aria-hidden />
    </Link>
  );
}
