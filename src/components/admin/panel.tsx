import type { ReactNode } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/kit/empty-state";
import { Notice } from "@/components/kit/notice";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("card flex min-w-0 flex-col", className)}>
      <header className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-2">
        <h2 className="text-[13px] font-medium tracking-tight">{title}</h2>
        {action}
      </header>
      <div className="min-w-0 flex-1 px-4 pb-4">{children}</div>
    </section>
  );
}

export function PageIntro({ title, lede, action }: { title: string; lede?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-[28px] font-semibold tracking-[-0.045em] sm:text-[32px]">{title}</h1>
        {lede ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{lede}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function ShareList({
  rows,
  empty,
}: {
  rows: { key: string; label: string; value: string; share: number; href?: string }[];
  empty: string;
}) {
  if (rows.length === 0) return <EmptyState title="Nothing in this range" hint={empty} />;
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((row) => (
        <li key={row.key} className="min-w-0">
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            {row.href ? (
              <Link href={row.href} className="truncate font-medium hover:underline">
                {row.label}
              </Link>
            ) : (
              <span className="truncate">{row.label}</span>
            )}
            <span className="shrink-0 font-mono text-[12px] text-muted-foreground tabular-nums">{row.value}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sunken">
            <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(2, Math.round(row.share * 100))}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Failed({ error }: { error: "unavailable" | "timeout" | "failed" }) {
  const title = error === "timeout" ? "The query timed out." : error === "unavailable" ? "Analytics database is not configured." : "The query failed.";
  const body = error === "timeout" ? "Narrow the range and try again." : error === "unavailable" ? "Set DATABASE_URL and reload." : "The database did not answer.";
  return <Notice tone="warn" role="alert" title={title} body={body} />;
}

export function shareOf(value: number, max: number): number {
  if (max <= 0) return 0;
  return value / max;
}
