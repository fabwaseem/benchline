"use client";

import { useState, type ReactNode, type RefObject } from "react";
import { Check, ChevronDown, LayoutGrid, List, Search } from "lucide-react";
import { Button } from "@/components/kit/primitives/button";
import { Input } from "@/components/kit/primitives/input";
import { Toggle } from "@/components/kit/primitives/toggle";
import { Select } from "@/components/kit/controls";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DirectorySort, DirectoryView } from "@/lib/directory";
import { cn } from "@/lib/utils";

export function FilterChip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Toggle
      pressed={pressed}
      onPressedChange={() => onClick()}
      className={cn(
        "h-control-sm rounded-sm border border-border bg-surface px-2.5 text-[13px] hover:border-border-strong data-pressed:border-brand-text data-pressed:bg-[color-mix(in_oklch,var(--accent-brand)_10%,var(--surface))] data-pressed:text-foreground",
        pressed && "border-brand-text bg-[color-mix(in_oklch,var(--accent-brand)_10%,var(--surface))] text-foreground",
      )}
    >
      {children}
    </Toggle>
  );
}

export function SortSelect({ value, onChange }: { value: DirectorySort; onChange: (value: DirectorySort) => void }) {
  return (
    <label className="inline-flex h-control-sm items-center gap-1.5 rounded-sm border border-border bg-surface px-2.5 text-[13px]">
      <span className="text-muted-foreground">Sort</span>
      <Select
        aria-label="Sort tools"
        value={value}
        onChange={(event) => onChange(event.target.value as DirectorySort)}
        className="h-auto w-auto border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
      >
        <option value="popular">Popular</option>
        <option value="az">A–Z</option>
        <option value="newest">Newest</option>
      </Select>
    </label>
  );
}

export function ViewToggle({ value, onChange }: { value: DirectoryView; onChange: (value: DirectoryView) => void }) {
  return (
    <div className="inline-flex h-control-sm overflow-hidden rounded-sm border border-border" role="group" aria-label="Layout">
      <Toggle
        pressed={value === "grid"}
        onPressedChange={() => onChange("grid")}
        aria-label="Grid view"
        className="grid h-control-sm w-control-sm place-items-center rounded-none"
      >
        <LayoutGrid size={15} strokeWidth={1.75} />
      </Toggle>
      <Toggle
        pressed={value === "list"}
        onPressedChange={() => onChange("list")}
        aria-label="List view"
        className="grid w-control-sm place-items-center rounded-none border-l border-border"
      >
        <List size={15} strokeWidth={1.75} />
      </Toggle>
    </div>
  );
}

export function TagMenu({
  tags,
  value,
  onChange,
}: {
  tags: { slug: string; count: number }[];
  value: string;
  onChange: (tag: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = value === "all" ? "Tags" : `#${value}`;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="inline-flex h-control-sm items-center gap-1 rounded-sm border border-border bg-surface px-2.5 text-[13px] transition-colors duration-150 hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        {label}
        <ChevronDown size={14} strokeWidth={1.75} aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1">
        <div className="max-h-64 overflow-auto">
          <TagOption
            label="All tags"
            active={value === "all"}
            onSelect={() => {
              onChange("all");
              setOpen(false);
            }}
          />
          {tags.map((tag) => (
            <TagOption
              key={tag.slug}
              label={tag.slug}
              count={tag.count}
              active={value === tag.slug}
              onSelect={() => {
                onChange(tag.slug);
                setOpen(false);
              }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TagOption({ label, count, active, onSelect }: { label: string; count?: number; active: boolean; onSelect: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onSelect}
      className="h-8 w-full justify-start gap-2 rounded-sm px-2 font-normal"
    >
      <Check size={14} className={active ? "opacity-100" : "opacity-0"} aria-hidden />
      <span className="min-w-0 flex-1 truncate text-left font-mono text-[12px]">{label}</span>
      {typeof count === "number" ? <span className="text-[11px] text-faint tabular-nums">{count}</span> : null}
    </Button>
  );
}

export function DirectorySearch({
  value,
  onChange,
  placeholder,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label="Search tools"
      prefix={<Search size={14} strokeWidth={1.75} />}
      className="h-control-sm min-w-[12rem] flex-1 sm:max-w-xs"
    />
  );
}
