"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openCommandK } from "@/components/site/open-command";

export function OpenSearch() {
  return (
    <Button type="button" variant="outline" size="sm" onClick={() => openCommandK()} aria-label="Search tools">
      <Search />
      <span className="hidden sm:inline">Search</span>
      <kbd className="hidden rounded border border-border px-1 text-[10px] text-muted-foreground sm:inline">⌘K</kbd>
    </Button>
  );
}
