"use client";

import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { ChevronDown } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

export type ComboOption = { value: string; label: string; group?: string };

const popup = "z-50 max-h-64 w-(--anchor-width) min-w-40 origin-(--transform-origin) overflow-auto rounded-xl border border-border bg-popover p-1 text-[13px] text-popover-foreground shadow-md outline-none";

export function Combobox({
  value,
  onValueChange,
  options,
  placeholder = "Search…",
  label,
  empty = "No matches",
  disabled,
  id,
  className,
}: {
  value: string | null;
  onValueChange: (value: string | null) => void;
  options: ComboOption[];
  placeholder?: string;
  label?: string;
  empty?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}) {
  const labels = useMemo(() => new Map(options.map((option) => [option.value, option.label])), [options]);
  const groups = useMemo(() => {
    const map = new Map<string, ComboOption[]>();
    for (const option of options) {
      const key = option.group ?? "";
      map.set(key, [...(map.get(key) ?? []), option]);
    }
    return [...map.entries()];
  }, [options]);
  return (
    <ComboboxPrimitive.Root
      items={options.map((option) => option.value)}
      value={value}
      onValueChange={(next) => onValueChange(next)}
      disabled={disabled}
      itemToStringLabel={(item) => labels.get(item) ?? item}
    >
      <div className={cn("flex h-control-lg items-center rounded-sm border border-border-strong bg-surface focus-within:border-brand focus-within:ring-2 focus-within:ring-ring/40 min-[700px]:h-control-md", className)}>
        <ComboboxPrimitive.Input id={id} aria-label={label} placeholder={placeholder} className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-[13px] outline-none placeholder:text-faint" />
        <ComboboxPrimitive.Trigger aria-label={label ? `Open ${label}` : "Open"} className="grid h-full w-control-md place-items-center text-muted-foreground">
          <ChevronDown className="size-3.5" />
        </ComboboxPrimitive.Trigger>
      </div>
      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner sideOffset={4} className="isolate z-50">
          <ComboboxPrimitive.Popup className={popup}>
            <ComboboxPrimitive.Empty className="px-2 py-2 text-faint">{empty}</ComboboxPrimitive.Empty>
            <ComboboxPrimitive.List>
              {groups.map(([group, items]) => (
                <ComboboxPrimitive.Group key={group || "all"} className="py-0.5">
                  {group ? <ComboboxPrimitive.GroupLabel className="px-2 py-1 font-mono text-[10px] tracking-[0.08em] text-faint uppercase">{group}</ComboboxPrimitive.GroupLabel> : null}
                  {items.map((item) => (
                    <ComboboxPrimitive.Item key={item.value} value={item.value} className="flex cursor-default items-center rounded-sm px-2 py-1.5 outline-none data-highlighted:bg-sunken">
                      {item.label}
                    </ComboboxPrimitive.Item>
                  ))}
                </ComboboxPrimitive.Group>
              ))}
            </ComboboxPrimitive.List>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  );
}
