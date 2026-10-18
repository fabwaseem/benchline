"use client";

import { cn } from "@/lib/utils";

export function SegmentedControl<T extends string>(props: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  label: string;
  className?: string;
}) {
  return <Segmented {...props} />;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("seg max-w-full overflow-x-auto", className)}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className="shrink-0 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none max-[699px]:h-11"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
