import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ToolWorkspace({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("overflow-hidden rounded-xl border border-border bg-surface", className)}>{children}</div>;
}
