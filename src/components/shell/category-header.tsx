import Link from "next/link";
import { Cover } from "@/components/site/cover";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { StatChip } from "@/components/kit/stat-chip";
import type { ChildLink } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

export function CategoryHeader({
  name,
  description,
  icon,
  hue,
  count,
  localCount,
  mcpCount,
  breadcrumbs,
  chips,
  activeChip,
  parentSlug,
}: {
  name: string;
  description: string;
  icon: string;
  hue: number;
  count: number;
  localCount: number;
  mcpCount: number;
  breadcrumbs: { href: string; label: string }[];
  chips: ChildLink[] | null;
  activeChip: string;
  parentSlug: string;
}) {
  const localLabel = localCount === count ? "All run in browser" : `${localCount} run in browser`;
  const mcpLabel = mcpCount === count ? "All MCP ready" : `${mcpCount} MCP ready`;
  return (
    <header className="px-4 pt-6 lg:px-8">
      <Breadcrumbs items={breadcrumbs} />
      <div className="mt-4 flex items-start gap-4">
        <Cover hue={hue} icon={icon} size={48} />
        <div className="min-w-0">
          <h1 className="text-[28px] font-semibold tracking-[-0.03em]">{name} tools</h1>
          <p className="mt-1.5 max-w-[62ch] text-[15px] leading-6 text-muted-foreground">{description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <StatChip>{count} {count === 1 ? "tool" : "tools"}</StatChip>
            <StatChip>{localLabel}</StatChip>
            <StatChip>{mcpLabel}</StatChip>
          </div>
        </div>
      </div>
      {chips ? (
        <div className="mt-5 flex flex-wrap gap-1.5" role="navigation" aria-label="Subcategories">
          <Link href={`/${parentSlug}`} aria-current={activeChip === parentSlug ? "page" : undefined} className={chipClass(activeChip === parentSlug)}>
            All
            <span className="font-mono text-faint tabular-nums">{count}</span>
          </Link>
          {chips.map((chip) => {
            const on = activeChip === chip.slug;
            return (
              <Link key={chip.slug} href={`/${chip.slug}`} aria-current={on ? "page" : undefined} className={chipClass(on)}>
                {chip.name}
                <span className="font-mono text-faint tabular-nums">{chip.count}</span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </header>
  );
}

function chipClass(on: boolean) {
  return cn(
    "inline-flex h-7 items-center gap-1.5 rounded-lg border border-border bg-surface px-2 text-[12.5px] text-muted-foreground transition-colors duration-150 hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
    on && "border-brand-text bg-[color-mix(in_oklch,var(--accent-brand)_10%,var(--surface))] text-foreground",
  );
}
