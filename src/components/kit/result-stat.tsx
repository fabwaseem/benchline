import { cn } from "@/lib/utils";

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
        <div className="font-mono text-[20px] tracking-[-0.04em] tabular-nums">{value}</div>
        <div className="text-[12px] text-muted-foreground">{label}</div>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    );
  }
  return (
    <div className={cn("rounded-lg border border-border bg-background px-3 py-2", className)}>
      <div className="text-[11px] tracking-tight text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-lg tracking-tight tabular-nums">{value}</div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
