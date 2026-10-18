import { Cover } from "@/components/site/cover";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { StatChip } from "@/components/kit/stat-chip";
import type { DirectoryCategory } from "@/lib/catalog";

export function CategoryHeader({
  category,
  localCount,
  mcpCount,
}: {
  category: DirectoryCategory;
  localCount: number;
  mcpCount: number;
}) {
  const localLabel = localCount === category.count ? "All run in browser" : `${localCount} run in browser`;
  const mcpLabel = mcpCount === category.count ? "All MCP ready" : `${mcpCount} MCP ready`;
  return (
    <header className="px-4 pt-6 lg:px-8">
      <Breadcrumbs
        items={[
          { href: "/", label: "Tools" },
          { href: `/${category.slug}`, label: category.name },
        ]}
      />
      <div className="mt-4 flex items-start gap-4">
        <Cover hue={category.hue} icon={category.icon} size={52} />
        <div className="min-w-0">
          <h1 className="text-[32px] font-semibold tracking-[-0.045em]">{category.name} tools</h1>
          <p className="mt-1.5 max-w-[62ch] text-[15px] leading-6 text-muted-foreground">{category.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatChip>{category.count} {category.count === 1 ? "tool" : "tools"}</StatChip>
            <StatChip>{localLabel}</StatChip>
            <StatChip>{mcpLabel}</StatChip>
          </div>
        </div>
      </div>
    </header>
  );
}
