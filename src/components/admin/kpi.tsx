"use client";

import { Sparkline } from "@/components/admin/charts";
import { formatDelta } from "@/lib/admin/format";
import { percentDelta } from "@/lib/admin/shape";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  display,
  previous,
  spark,
  compare,
  lowerIsBetter = false,
}: {
  label: string;
  value: number | null;
  display: string;
  previous: number | null;
  spark: number[];
  compare: boolean;
  lowerIsBetter?: boolean;
}) {
  const delta = compare ? percentDelta(value, previous) : null;
  const improved = delta !== null && (lowerIsBetter ? delta < 0 : delta > 0);
  const worse = delta !== null && (lowerIsBetter ? delta > 0 : delta < 0);
  return (
    <article className="card flex min-w-0 flex-col justify-between px-3.5 py-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-mono text-[11px] tracking-[0.06em] text-faint uppercase">{label}</p>
        <Sparkline values={spark} tone={improved ? "good" : worse ? "bad" : "neutral"} />
      </div>
      <p className="mt-2 font-mono text-[26px] tracking-[-0.04em] tabular-nums">{display}</p>
      {compare ? (
        <p className={cn("mt-1 text-[12px] tabular-nums", improved && "text-status-ok", worse && "text-status-bad", !improved && !worse && "text-muted-foreground")}>
          {formatDelta(delta)}
          <span className="text-muted-foreground"> vs previous</span>
        </p>
      ) : (
        <p className="mt-1 h-4 text-[12px] text-muted-foreground"> </p>
      )}
    </article>
  );
}
