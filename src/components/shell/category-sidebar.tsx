import type { ReactNode } from "react";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
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
    <div className="flex h-full flex-col gap-1 px-3 py-4">
      <p className="px-2.5 pb-2 font-mono text-[11px] tracking-[0.08em] text-faint uppercase">Categories</p>
      <SidebarLink href="/" label="All tools" count={total} icon={<LayoutGrid size={16} strokeWidth={1.75} aria-hidden />} active={active === "all"} onNavigate={onNavigate} />
      {categories.map((category) => (
        <SidebarLink
          key={category.slug}
          href={`/${category.slug}`}
          label={category.name}
          count={category.count}
          icon={<ToolIcon name={category.icon} size={16} />}
          active={active === category.slug}
          onNavigate={onNavigate}
        />
      ))}
      <Link
        href="/mcp/guide"
        onClick={onNavigate}
        className="mt-4 rounded-xl border border-border p-3 text-[13px] leading-snug transition-colors duration-150 hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className="block text-foreground">Use every tool from your AI agent</span>
        <span className="mt-1 block text-muted-foreground">Connect MCP</span>
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
        "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] text-muted-foreground transition-colors duration-150 hover:bg-sunken hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        active && "bg-[color-mix(in_oklch,var(--accent-brand)_12%,transparent)] text-foreground shadow-[inset_2px_0_0_var(--accent-brand)]",
      )}
    >
      <span className={cn("text-faint", active && "text-brand-text")}>{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="font-mono text-[12px] text-faint tabular-nums">{count}</span>
    </Link>
  );
}
