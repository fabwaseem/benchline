"use client";

import type { RefObject } from "react";
import Link from "next/link";
import { LayoutGrid, List, Search, X } from "kineticons";
import { Button } from "@/components/kit/primitives/button";
import { Input } from "@/components/kit/primitives/input";
import { Select } from "@/components/kit/controls";
import type { DirectorySort, DirectoryView } from "@/lib/directory";

/** Every control in the filter bar uses `.ctl`: 44px on a phone, 36px from 640px up, one border, radius and type size. */

export function SortSelect({ value, onChange }: { value: DirectorySort; onChange: (value: DirectorySort) => void }) {
  return (
    <label className="ctl cursor-pointer pr-1.5">
      <span className="text-faint">Sort</span>
      <Select
        aria-label="Sort tools"
        value={value}
        onChange={(event) => onChange(event.target.value as DirectorySort)}
        className="h-full w-auto border-0 bg-transparent px-1 font-medium text-foreground shadow-none hover:border-0 focus-visible:ring-0"
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
    <div className="ctl ctl-seg" role="group" aria-label="Layout">
      <Button type="button" variant="ghost" size="icon" aria-pressed={value === "grid"} aria-label="Grid view" onClick={() => onChange("grid")}>
        <LayoutGrid size={16} aria-hidden />
      </Button>
      <Button type="button" variant="ghost" size="icon" aria-pressed={value === "list"} aria-label="List view" onClick={() => onChange("list")}>
        <List size={16} aria-hidden />
      </Button>
    </div>
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
      prefix={<Search size={15} aria-hidden />}
      kbd="/"
      className="ctl w-full min-w-0 cursor-text px-3 font-normal text-foreground"
    />
  );
}

export function ClearTag({ tag, href }: { tag: string; href: string }) {
  return (
    <Link href={href} data-on="true" className="ctl font-mono text-[12.5px]">
      #{tag}
      <span className="sr-only">Clear tag</span>
      <X size={13} aria-hidden />
    </Link>
  );
}
