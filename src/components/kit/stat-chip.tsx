import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatChip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-7 items-center rounded-full border border-border bg-surface px-2.5 text-[12.5px] text-muted-foreground", className)}>
      {children}
    </span>
  );
}
