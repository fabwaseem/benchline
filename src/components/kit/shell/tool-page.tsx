import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Tool page on the site container (same width and edges as the header and home). No sidebar, no right rail. */
export function ToolPage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("page-x frame py-6 lg:py-8", className)}>{children}</div>;
}
