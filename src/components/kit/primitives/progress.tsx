"use client";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { cn } from "@/lib/utils";

export function Progress({
  value,
  label,
  className,
}: {
  value: number | null;
  label?: string;
  className?: string;
}) {
  return (
    <ProgressPrimitive.Root value={value} aria-label={label} className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <div className="flex items-baseline justify-between gap-2 text-[12px] text-muted-foreground">
          <ProgressPrimitive.Label>{label}</ProgressPrimitive.Label>
          <ProgressPrimitive.Value className="font-mono tabular-nums" />
        </div>
      ) : null}
      <ProgressPrimitive.Track className="relative h-1.5 overflow-hidden rounded-sm bg-sunken">
        <ProgressPrimitive.Indicator className="h-full bg-brand" />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
}
