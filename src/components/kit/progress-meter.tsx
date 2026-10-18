export function ProgressMeter({ label, value }: { label: string; value: number }) {
  const percent = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const shown = Math.round(percent);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[12px] text-muted-foreground">
        <span>{label}</span>
        <span className="font-mono tabular-nums">{shown}%</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-sunken"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={shown}
      >
        <div className="h-full bg-foreground transition-[width] duration-150" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
