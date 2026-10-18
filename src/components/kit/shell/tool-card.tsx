import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The tool workspace frame: toolbar, panes, and a status strip. */
export function ToolCard({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("overflow-hidden rounded-xl border border-border bg-surface", className)}>{children}</section>;
}
