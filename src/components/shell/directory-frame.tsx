"use client";

import { useState, type ReactNode } from "react";
import { CategorySidebar } from "@/components/shell/category-sidebar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { DirectoryCategory } from "@/lib/catalog";

export function DirectoryFrame({
  categories,
  total,
  active,
  children,
}: {
  categories: DirectoryCategory[];
  total: number;
  active: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-border lg:block">
        <CategorySidebar categories={categories} total={total} active={active} />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function MobileCategories({
  categories,
  total,
  active,
}: {
  categories: DirectoryCategory[];
  total: number;
  active: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        className="inline-flex h-8 items-center rounded-lg border border-border bg-surface px-2.5 text-[13px] lg:hidden"
        onClick={() => setOpen(true)}
      >
        Categories
      </button>
      <SheetContent side="left" className="w-72 bg-background p-0">
        <SheetTitle className="sr-only">Categories</SheetTitle>
        <CategorySidebar categories={categories} total={total} active={active} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
