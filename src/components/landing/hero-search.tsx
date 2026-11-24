"use client";

import { Search } from "kineticons";
import { Kbd } from "@/components/kit/kbd";
import { Button } from "@/components/kit/primitives/button";
import { openCommandK } from "@/components/site/open-command";

export function HeroSearch({ total }: { total: number }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="lg"
      onClick={() => openCommandK()}
      className="group flex min-w-0 flex-1 justify-start font-normal hover:bg-surface w-full items-center gap-3 rounded-md bg-surface px-4 text-left shadow-[inset_0_0_0_1px_var(--border-strong),var(--shadow-2)] transition-[box-shadow,transform] duration-150 hover:shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--accent-text)_55%,transparent),var(--shadow-2)] active:translate-y-px focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Search size={19} strokeWidth={2} className="text-brand-text" aria-hidden />
      <span className="flex-1 truncate text-[15.5px] text-muted-foreground">
        Search {total} tools: <span className="text-foreground">jwt</span>, <span className="text-foreground">pdf merge</span>…
      </span>
      <span className="hidden gap-1 sm:flex" aria-hidden>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </span>
    </Button>
  );
}
