import { Cover } from "@/components/site/cover";
import { Breadcrumbs } from "@/components/site/breadcrumbs";

/** A compact category header: icon, name, one line of description, one line of counts. */
export function CategoryHeader({
  name,
  description,
  icon,
  hue,
  count,
  localCount,
  mcpCount,
  breadcrumbs,
}: {
  name: string;
  description: string;
  icon: string;
  hue: number;
  count: number;
  localCount: number;
  mcpCount: number;
  breadcrumbs: { href: string; label: string }[];
}) {
  const facts = [
    `${count} ${count === 1 ? "tool" : "tools"}`,
    localCount === count ? "All run in your browser" : `${localCount} run in your browser`,
    mcpCount === count ? "All MCP ready" : `${mcpCount} MCP ready`,
  ];
  return (
    <header className="border-b border-border pt-6 pb-6 lg:pl-8">
      <Breadcrumbs items={breadcrumbs} className="text-[12.5px]" />
      <div data-enter className="mt-4 flex items-center gap-4">
        <Cover hue={hue} icon={icon} size={52} className="rounded-xl" />
        <div className="min-w-0">
          <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.035em] sm:text-[30px]">{name} tools</h1>
          <p className="mt-1 text-[14.5px] leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      <ul className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground" aria-label="About this category">
        {facts.map((fact, index) => (
          <li key={fact} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden className="size-1 rounded-full bg-border-strong" /> : null}
            <span className={index === 0 ? "font-semibold text-brand-text tabular-nums" : undefined}>{fact}</span>
          </li>
        ))}
      </ul>
    </header>
  );
}
