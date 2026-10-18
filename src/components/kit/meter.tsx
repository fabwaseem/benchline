import { cn } from "@/lib/utils";

export function Meter({
  label,
  value,
  max,
  hint,
}: {
  label: string;
  value: number;
  max: number;
  hint?: string;
}) {
  const over = max > 0 && value > max;
  const width = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
        <span>{label}</span>
        <span className={cn("font-mono tabular-nums", over ? "text-status-bad" : "text-muted-foreground")}>
          {value.toLocaleString("en-US")} / {max.toLocaleString("en-US")}
        </span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-well"
      >
        <div
          className={cn("h-full", over ? "bg-destructive" : "bg-foreground")}
          style={{ width: `${width}%` }}
        />
      </div>
      {hint ? <p className="mt-1 text-[12px] text-faint">{hint}</p> : null}
    </div>
  );
}
