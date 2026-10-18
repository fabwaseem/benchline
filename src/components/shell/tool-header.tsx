import Link from "next/link";
import { Cover } from "@/components/site/cover";
import { ToolActions } from "@/components/site/tool-actions";
import { McpNameChip } from "@/components/shell/mcp-name-chip";
import { Breadcrumbs } from "@/components/site/breadcrumbs";

export function ToolHeader({
  name,
  tagline,
  categorySlug,
  categoryName,
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
  hue: number;
  icon: string;
  runsLocally: boolean;
  mcpName: string | null;
  slug: string;
}) {
  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <Cover hue={hue} icon={icon} size={56} />
        <div className="min-w-0">
          <Breadcrumbs
            items={[
              { href: "/", label: "Tools" },
              { href: `/${categorySlug}`, label: categoryName },
              { href: `/t/${slug}`, label: name },
            ]}
          />
          <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.045em]">{name}</h1>
          <p className="mt-1.5 max-w-[62ch] text-[15px] leading-6 text-muted-foreground">{tagline}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="chip">{runsLocally ? "Runs in browser" : "Fetches a public URL"}</span>
            {mcpName ? <McpNameChip name={mcpName} /> : null}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <ToolActions slug={slug} title={name} />
        <Link href="#agent" className="btn btn-accent">
          Use via MCP
        </Link>
      </div>
    </header>
  );
}
