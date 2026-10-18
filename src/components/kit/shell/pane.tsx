import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Pane({
  label,
  actions,
  children,
  className,
  bodyClassName,
  padded = true,
  scroll = true,
}: {
  label?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  padded?: boolean;
  scroll?: boolean;
}) {
  return (
    <section className={cn("flex min-h-0 min-w-0 flex-col", className)}>
      {label || actions ? (
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
          {label ? (
            <h2 className="truncate font-mono text-[11px] font-medium tracking-[0.08em] text-faint uppercase whitespace-nowrap" title={label}>
              {label}
            </h2>
          ) : null}
          {actions ? <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-1.5">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn("min-h-0 min-w-0 flex-1", scroll && "overflow-auto", padded && "flex flex-col gap-3 p-3", bodyClassName)}>{children}</div>
    </section>
  );
}
