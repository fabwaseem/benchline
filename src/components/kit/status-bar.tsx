import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatusBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 border-t border-border px-4 py-2 font-mono text-[12px] text-muted-foreground", className)}>
      {children}
    </div>
  );
}
