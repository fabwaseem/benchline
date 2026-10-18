"use client";

import { useState, type ReactNode, type RefObject } from "react";
import { Check, ChevronDown, LayoutGrid, List, Search } from "lucide-react";
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
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center rounded-lg border border-border bg-surface px-2.5 text-[13px] transition-colors duration-150 hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        pressed && "border-brand-text bg-[color-mix(in_oklch,var(--accent-brand)_10%,var(--surface))] text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function SortSelect({ value, onChange }: { value: DirectorySort; onChange: (value: DirectorySort) => void }) {
  return (
    <label className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-[13px]">
      <span className="text-muted-foreground">Sort</span>
      <select
        aria-label="Sort tools"
        value={value}
        onChange={(event) => onChange(event.target.value as DirectorySort)}
        className="bg-transparent text-foreground outline-none"
      >
        <option value="popular">Popular</option>
        <option value="az">A–Z</option>
        <option value="newest">Newest</option>
      </select>
    </label>
  );
}

export function ViewToggle({ value, onChange }: { value: DirectoryView; onChange: (value: DirectoryView) => void }) {
  return (
    <div className="inline-flex h-8 overflow-hidden rounded-lg border border-border" role="group" aria-label="Layout">
      <button
        type="button"
        aria-pressed={value === "grid"}
        aria-label="Grid view"
        onClick={() => onChange("grid")}
        className={cn("grid w-8 place-items-center text-muted-foreground transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none", value === "grid" && "bg-sunken text-foreground")}
      >
        <LayoutGrid size={15} strokeWidth={1.75} />
      </button>
      <button
        type="button"
        aria-pressed={value === "list"}
        aria-label="List view"
        onClick={() => onChange("list")}
        className={cn("grid w-8 place-items-center border-l border-border text-muted-foreground transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none", value === "list" && "bg-sunken text-foreground")}
      >
        <List size={15} strokeWidth={1.75} />
      </button>
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
      <PopoverTrigger className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-surface px-2.5 text-[13px] transition-colors duration-150 hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
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
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Check size={14} className={active ? "opacity-100" : "opacity-0"} aria-hidden />
      <span className="min-w-0 flex-1 truncate font-mono text-[12px]">{label}</span>
      {typeof count === "number" ? <span className="text-[11px] text-faint tabular-nums">{count}</span> : null}
    </button>
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
    <label className="flex h-8 min-w-[12rem] flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-2.5 text-[13px] transition-colors duration-150 focus-within:border-brand-text focus-within:ring-2 focus-within:ring-ring sm:max-w-xs">
      <Search size={14} strokeWidth={1.75} className="text-faint" aria-hidden />
      <span className="sr-only">Search tools</span>
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-foreground outline-none placeholder:text-faint"
      />
    </label>
  );
}
