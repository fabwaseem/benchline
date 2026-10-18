import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-[22px] items-center rounded-sm bg-sunken px-1.5 font-mono text-[11px] text-muted-foreground", className)}>
      {children}
    </span>
  );
}

export function Badge({ children, className, variant }: { children: ReactNode; className?: string; variant?: "mono" | "default" }) {
  return <Tag className={cn(variant === "mono" && "font-mono", className)}>{children}</Tag>;
}
