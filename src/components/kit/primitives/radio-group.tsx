"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function RadioGroup<T extends string>({
  value,
  onValueChange,
  label,
  options,
  className,
  disabled,
}: {
  value: T;
  onValueChange: (value: T) => void;
  label: string;
  options: { value: T; label: ReactNode; disabled?: boolean }[];
  className?: string;
  disabled?: boolean;
}) {
  return (
    <RadioGroupPrimitive
      aria-label={label}
      value={value}
      onValueChange={(next) => onValueChange(next as T)}
      disabled={disabled}
      className={cn("flex flex-col gap-2", className)}
    >
      {options.map((option) => (
        <label key={option.value} className="flex items-center gap-2 text-[13px]">
          <Radio.Root
            value={option.value}
            disabled={option.disabled}
            className="grid size-4 place-items-center rounded-full border border-border-strong bg-surface outline-none focus-visible:ring-2 focus-visible:ring-ring data-checked:border-brand data-disabled:opacity-40"
          >
            <Radio.Indicator className="size-2 rounded-full bg-brand" />
          </Radio.Root>
          <span>{option.label}</span>
        </label>
      ))}
    </RadioGroupPrimitive>
  );
}
