"use client";

import type { ReactNode } from "react";
import { Toolbar } from "@base-ui/react/toolbar";
import { cn } from "@/lib/utils";

export function ButtonGroup({
  label = "Actions",
  children,
  className,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Toolbar.Root aria-label={label} className={cn("inline-flex", className)}>
      <Toolbar.Group className="inline-flex items-center gap-1">{children}</Toolbar.Group>
    </Toolbar.Root>
  );
}
