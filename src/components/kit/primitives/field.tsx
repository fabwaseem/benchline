"use client";

import { Field as FieldPrimitive } from "@base-ui/react/field";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  error,
  required = false,
  children,
  className,
  actions,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <FieldPrimitive.Root className={cn("flex flex-col gap-2", className)} invalid={Boolean(error)}>
      {label || actions ? (
        <div className="flex items-center justify-between gap-2">
          {label ? (
            <FieldPrimitive.Label className="min-w-0 truncate text-[12.5px] font-medium text-fg2">
              {label}
              {required ? <span className="text-status-bad"> *</span> : null}
            </FieldPrimitive.Label>
          ) : (
            <span />
          )}
          {actions}
        </div>
      ) : null}
      {children}
      {error ? <FieldPrimitive.Error className="text-xs text-status-bad">{error}</FieldPrimitive.Error> : null}
      {hint ? <FieldPrimitive.Description className="text-[12px] text-faint">{hint}</FieldPrimitive.Description> : null}
    </FieldPrimitive.Root>
  );
}

export { FieldPrimitive };
