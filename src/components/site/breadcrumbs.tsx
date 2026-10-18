import Link from "next/link";
import { cn } from "@/lib/utils";

export function Breadcrumbs({
  items,
  className,
}: {
  items: { href: string; label: string }[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn("font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase", className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-1.5">
              {index > 0 ? <span aria-hidden>/</span> : null}
              {last ? (
                <span className="text-foreground">{item.label}</span>
              ) : (
                <Link href={item.href} className="transition-colors duration-150 hover:text-foreground">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
