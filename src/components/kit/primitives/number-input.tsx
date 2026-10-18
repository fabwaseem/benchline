"use client";

import { NumberField } from "@base-ui/react/number-field";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function NumberInput({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  step = 1,
  unit,
  disabled,
  id,
  className,
  "aria-label": ariaLabel,
}: {
  value?: number | null;
  defaultValue?: number;
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <NumberField.Root
      id={id}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={cn("flex h-control-lg items-center overflow-hidden rounded-sm border border-border-strong bg-surface min-[700px]:h-control-md", className)}
    >
      <NumberField.Decrement aria-label="Decrease" className="grid h-full w-control-md place-items-center text-muted-foreground hover:bg-sunken hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40">
        <Minus className="size-3.5" />
      </NumberField.Decrement>
      <NumberField.Input aria-label={ariaLabel} className="h-full min-w-0 flex-1 bg-transparent text-center text-[13px] text-foreground outline-none tabular-nums" />
      {unit ? <span className="pr-1 font-mono text-[11px] text-faint">{unit}</span> : null}
      <NumberField.Increment aria-label="Increase" className="grid h-full w-control-md place-items-center text-muted-foreground hover:bg-sunken hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40">
        <Plus className="size-3.5" />
      </NumberField.Increment>
    </NumberField.Root>
  );
}
