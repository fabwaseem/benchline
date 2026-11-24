import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** One heading look for every in-page section: optional eyebrow, a sentence-case title, an optional line under it. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  children,
  action,
  className,
}: {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-3", className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-brand-text uppercase">{eyebrow}</p> : null}
        <h2 id={id} className={cn("text-[22px] font-semibold tracking-[-0.03em] text-balance", eyebrow && "mt-2")}>
          {title}
        </h2>
        {children ? <div className="mt-1.5 max-w-[68ch] text-[14px] leading-6 text-muted-foreground">{children}</div> : null}
      </div>
      {action}
    </div>
  );
}
