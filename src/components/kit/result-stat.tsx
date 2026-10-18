import { Truncate } from "@/components/kit/shell/truncate";
import { cn } from "@/lib/utils";

export function SizeStat({
  before,
  after,
  beforeLabel = "Before",
  afterLabel = "After",
  hint,
}: {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
  hint?: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3 rounded-lg border border-border bg-surface px-3 py-2">
      <div>
        <div className="truncate font-mono text-[11px] tracking-[0.06em] text-faint uppercase whitespace-nowrap" title={beforeLabel}>{beforeLabel}</div>
        <div className="truncate font-mono text-lg whitespace-nowrap" title={before}>{before}</div>
      </div>
      <span className="pb-1 text-faint" aria-hidden>→</span>
      <div className="min-w-0 text-right">
        <div className="truncate font-mono text-[11px] tracking-[0.06em] text-faint uppercase whitespace-nowrap" title={afterLabel}>{afterLabel}</div>
        <div className="truncate font-mono text-lg whitespace-nowrap" title={after}>{after}</div>
      </div>
      {hint ? <p className="col-span-3 text-[12px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function ResultStat({
  label,
  value,
  hint,
  variant = "card",
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  variant?: "card" | "well";
  className?: string;
}) {
  if (variant === "well") {
    return (
      <div className={cn("well px-3 py-3", className)}>
        <Truncate value={value} className="font-mono text-[20px] tracking-[-0.04em]" />
        <Truncate value={label} className="text-[12px] text-muted-foreground" />
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    );
  }
  return (
    <div className={cn("rounded-lg border border-border bg-background px-3 py-2", className)}>
      <Truncate value={label} className="text-[11px] tracking-tight text-muted-foreground" />
      <Truncate value={value} className="mt-1 font-mono text-lg tracking-tight" />
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
