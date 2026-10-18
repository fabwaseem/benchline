"use client";

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/kit/primitives/select";
import { Combobox, type ComboOption } from "@/components/kit/primitives/combobox";
import { cn } from "@/lib/utils";

export function SelectField({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  label,
  searchable,
  disabled,
  id,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: ComboOption[];
  placeholder?: string;
  label?: string;
  searchable?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}) {
  const search = searchable ?? options.length > 12;
  if (search) {
    return (
      <Combobox
        id={id}
        label={label}
        value={value}
        onValueChange={(next) => { if (next) onValueChange(next); }}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />
    );
  }
  const groups = new Map<string, ComboOption[]>();
  for (const option of options) {
    const key = option.group ?? "";
    groups.set(key, [...(groups.get(key) ?? []), option]);
  }
  return (
    <Select value={value} onValueChange={(next) => { if (next) onValueChange(next); }} disabled={disabled}>
      <SelectTrigger id={id} aria-label={label} className={cn("h-control-lg w-full rounded-sm border-border-strong bg-surface min-[700px]:h-control-md", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {[...groups.entries()].map(([group, items]) => (
          <SelectGroup key={group || "all"}>
            {group ? <SelectLabel>{group}</SelectLabel> : null}
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
