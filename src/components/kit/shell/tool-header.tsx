import Link from "next/link";
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
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <Cover hue={hue} icon={icon} size={44} className="rounded-xl" />
        <div className="min-w-0">
          <Breadcrumbs
            items={[
              { href: "/", label: "Tools" },
              ...(parent ? [parent] : []),
              { href: `/${categorySlug}`, label: categoryName },
              { href: `/t/${slug}`, label: name },
            ]}
          />
          <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.03em] sm:text-[28px]">{name}</h1>
          <p className="mt-1.5 max-w-[62ch] text-[15px] leading-6 text-muted-foreground">{tagline}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="chip" title={runsLocally ? "Runs in browser" : "Fetches a public URL"}>
              {runsLocally ? "Runs in browser" : "Fetches a public URL"}
            </span>
            {mcpName ? <McpNameChip name={mcpName} /> : null}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <ToolActions slug={slug} title={name} />
        <Button variant="primary" nativeButton={false} render={<Link href="#agent" />}>
          Use via MCP
        </Button>
      </div>
    </header>
  );
}
