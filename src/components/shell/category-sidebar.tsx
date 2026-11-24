import type { ReactNode } from "react";
import Link from "next/link";
import { LayoutGrid } from "kineticons";
import { ToolIcon } from "@/components/site/icons";
import type { DirectoryCategory } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function CategorySidebar({
  categories,
  total,
  active,
  onNavigate,
}: {
  categories: DirectoryCategory[];
  total: number;
  active: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-0.5 py-6 pr-4">
      <p className="px-2.5 pb-3 font-mono text-[11px] font-medium tracking-[0.1em] text-faint uppercase">Categories</p>
      <SidebarLink href="/tools" label="All tools" count={total} icon={<LayoutGrid size={16} strokeWidth={1.75} aria-hidden />} active={active === "all"} onNavigate={onNavigate} />
      {categories.map((category) => (
        <SidebarLink
          key={category.slug}
          href={`/${category.slug}`}
          label={category.name}
          count={category.count}
          icon={<ToolIcon name={category.icon} size={16} />}
          active={category.match.includes(active)}
          onNavigate={onNavigate}
        />
      ))}
      <Link
        href="/mcp/guide"
        onClick={onNavigate}
        className="lift mt-6 rounded-xl border border-border bg-brand-wash p-4 text-[13px] leading-snug focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className="block font-semibold text-foreground">Use every tool from your AI agent</span>
        <span className="mt-2 inline-flex items-center gap-1 font-medium text-brand-text">Connect MCP →</span>
      </Link>
    </div>
  );
}

function SidebarLink({
  href,
  label,
  count,
  icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  count: number;
  icon: ReactNode;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "ki-trigger flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13.5px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-sunken hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        active && "bg-brand-wash font-semibold text-foreground hover:bg-brand-wash",
      )}
    >
      <span className={cn("text-faint", active && "text-brand-text")}>{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className={cn("font-mono text-[12px] text-faint tabular-nums", active && "text-brand-text")}>{count}</span>
    </Link>
  );
}
