import Link from "next/link";
import { Cpu, Globe, Plug } from "kineticons";
import { Button } from "@/components/kit/primitives/button";
import { Cover } from "@/components/site/cover";
import { ToolActions } from "@/components/site/tool-actions";
import { McpNameChip } from "@/components/shell/mcp-name-chip";
import { Breadcrumbs } from "@/components/site/breadcrumbs";

export function ToolHeader({
  name,
  tagline,
  categorySlug,
  categoryName,
  parent,
  hue,
  icon,
  runsLocally,
  mcpName,
  slug,
}: {
  name: string;
  tagline: string;
  categorySlug: string;
  categoryName: string;
  parent: { href: string; label: string } | null;
  hue: number;
  icon: string;
  runsLocally: boolean;
  mcpName: string | null;
  slug: string;
}) {
  return (
    <header>
      <Breadcrumbs
        className="text-[12.5px] sm:text-[13px]"
        items={[
          { href: "/tools", label: "Tools" },
          ...(parent ? [parent] : []),
          { href: `/${categorySlug}`, label: categoryName },
          { href: `/t/${slug}`, label: name },
        ]}
      />

      <div data-enter className="mt-5 grid gap-x-5 gap-y-5 sm:mt-6 sm:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
        <Cover hue={hue} icon={icon} size={64} className="hidden rounded-2xl sm:inline-grid" />

        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <Cover hue={hue} icon={icon} size={44} className="rounded-xl sm:hidden" />
            <h1 className="h-page min-w-0">{name}</h1>
          </div>
          <p className="mt-2.5 max-w-[68ch] text-[15px] leading-6 text-muted-foreground sm:text-[16px] sm:leading-[1.6]">{tagline}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-transparent bg-brand-wash px-2.5 text-[12.5px] font-medium text-brand-text"
              title={runsLocally ? "Your input never leaves this tab" : "The server reads only the public URL you give it"}
            >
              {runsLocally ? <Cpu size={14} aria-hidden /> : <Globe size={14} aria-hidden />}
              {runsLocally ? "Runs in your browser" : "Fetches a public URL"}
            </span>
            {mcpName ? <McpNameChip name={mcpName} /> : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:col-span-2 sm:flex sm:justify-start lg:col-span-1 lg:justify-end">
          <ToolActions slug={slug} title={name} />
          <Button
            variant="primary"
            size="lg"
            className="sm:h-control-md sm:px-3.5 sm:text-[13.5px]"
            nativeButton={false}
            render={<Link href="#agent" />}
          >
            <Plug size={15} aria-hidden />
            Use via MCP
          </Button>
        </div>
      </div>
    </header>
  );
}
