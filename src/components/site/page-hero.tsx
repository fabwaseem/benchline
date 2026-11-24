import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The opening band of a content page: eyebrow, one headline, one line under it, and an optional aside on the right. Enters once on load. */
export function PageHero({
  eyebrow,
  title,
  children,
  aside,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("relative isolate overflow-hidden border-b border-border", className)}>
      <div aria-hidden className="ground-grid absolute inset-0 -z-10 [mask-image:radial-gradient(70%_120%_at_85%_0%,#000_10%,transparent_70%)]" />
      <div aria-hidden className="ground-glow absolute inset-0 -z-10 opacity-70" />
      <div data-enter className={cn("page-x frame grid gap-10 py-16 md:py-24", aside && "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end")}>
        <div className="max-w-[760px]">
          <p className="eyebrow">
            <span className="dot" aria-hidden />
            {eyebrow}
          </p>
          <h1 className="d2 mt-5">{title}</h1>
          {children ? <div className="mt-6 max-w-[58ch] text-[16.5px] leading-[1.65] text-muted-foreground md:text-[17.5px]">{children}</div> : null}
        </div>
        {aside ? <div className="min-w-0">{aside}</div> : null}
      </div>
    </header>
  );
}
