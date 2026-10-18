"use client";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
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
    <ToggleGroup
      aria-label={label}
      value={[value]}
      onValueChange={(next) => {
        const picked = next.find((item) => item !== value) ?? next[0];
        if (picked) onChange(picked as T);
      }}
      className={cn("seg max-w-full flex-wrap", className)}
    >
      {options.map((option) => (
        <Toggle key={option.value} value={option.value} className="shrink-0 max-[699px]:h-control-lg">
          {option.label}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}
