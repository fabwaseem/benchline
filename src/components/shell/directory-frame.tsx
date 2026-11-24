"use client";

import { useState, type ReactNode } from "react";
import { CategorySidebar } from "@/components/shell/category-sidebar";
import { Button } from "@/components/kit/primitives/button";
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
    <div className="page-x frame flex min-h-[calc(100vh-3.75rem)]">
      <aside className="sticky top-15 hidden h-[calc(100vh-3.75rem)] w-64 shrink-0 overflow-y-auto border-r border-border lg:block">
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
      <div className="shrink-0 lg:hidden">
        <Button type="button" variant="outline" className="ctl" onClick={() => setOpen(true)}>
          Categories
        </Button>
      </div>
      <SheetContent side="left" className="w-72 bg-background p-0">
        <SheetTitle className="sr-only">Categories</SheetTitle>
        <CategorySidebar categories={categories} total={total} active={active} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
