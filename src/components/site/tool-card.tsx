import Image from "next/image";
import Link from "next/link";
import { toolLogo } from "@/lib/assets";
import { ToolIcon } from "@/components/site/icons";
import { toneFor } from "@/components/site/tones";
import { cn } from "@/lib/utils";
import type { SearchRecord } from "@/registry/schema";

export function StatusChip({ status }: { status: SearchRecord["status"] }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] tracking-tight",
        status === "new"
          ? "bg-amber text-amber-foreground"
          : status === "deprecated"
            ? "bg-destructive/10 text-destructive"
            : "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}

export function ToolCard({
  tool,
  categoryName,
}: {
  tool: SearchRecord;
  categoryName: string;
}) {
  return (
    <Link
      href={`/t/${tool.slug}`}
      className="group flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <div className="flex items-start gap-3">
        <Image src={toolLogo(tool.slug)} alt="" width={40} height={40} className="size-10 shrink-0 rounded-lg" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold tracking-tight">{tool.name}</span>
            <StatusChip status={tool.status} />
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">{categoryName}</span>
        </span>
      </div>
      <p className="line-clamp-2 text-sm text-muted-foreground">{tool.tagline}</p>
      <span className="mt-auto text-xs font-medium text-primary">Open instrument</span>
    </Link>
  );
}

export function CategoryTile({
  slug,
  name,
  description,
  icon,
  count,
}: {
  slug: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}) {
  return (
    <Link
      href={`/${slug}`}
      className="flex min-w-0 flex-col gap-2 rounded-xl border border-border bg-card p-3 hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <span className={cn("flex size-8 items-center justify-center rounded-lg", toneFor(slug))}>
        <ToolIcon name={icon} className="size-4" />
      </span>
      <span className="text-sm font-semibold tracking-tight">{name}</span>
      <span className="line-clamp-2 text-xs text-muted-foreground">{description}</span>
      <span className="text-[11px] text-muted-foreground tabular-nums">{count} tools</span>
    </Link>
  );
}

export function TagChip({
  tag,
  count,
  active,
  href,
}: {
  tag: string;
  count?: number;
  active?: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs whitespace-nowrap",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/40",
      )}
    >
      {tag}
      {typeof count === "number" ? <span className="tabular-nums opacity-70">{count}</span> : null}
    </Link>
  );
}
