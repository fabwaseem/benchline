import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Centered tool page. No directory sidebar and no right rail. */
export function ToolPage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8", className)}>{children}</div>;
}
