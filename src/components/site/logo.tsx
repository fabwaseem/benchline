import Link from "next/link";
import { cn } from "@/lib/utils";

/** The Benchline mark: a block resting on the bench line. Forest tile in light, lime tile in dark. */
export function Mark({ size = 28, className, tone = "auto" }: { size?: number; className?: string; tone?: "auto" | "lime" | "forest" }) {
  const tile = tone === "lime" ? "fill-lime" : tone === "forest" ? "fill-forest" : "fill-forest dark:fill-lime";
  const ink = tone === "lime" ? "fill-forest" : tone === "forest" ? "fill-lime" : "fill-lime dark:fill-forest";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={cn("shrink-0", className)}>
      <rect width="32" height="32" rx="8" className={tile} />
      <rect x="6" y="20" width="20" height="3" rx="1.5" className={ink} />
      <rect x="16.5" y="9.5" width="8" height="8" rx="2" className={ink} />
      <rect x="8.5" y="13.5" width="5" height="4" rx="1.25" className={ink} opacity="0.55" />
    </svg>
  );
}

export function Logo({ className, word = true }: { className?: string; word?: boolean }) {
  return (
    <Link
      href="/"
      className={cn("group/logo inline-flex items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none", className)}
      aria-label="Benchline home"
    >
      <Mark size={26} className="transition-transform duration-200 group-hover/logo:-rotate-6" />
      {word ? <span className="text-[17px] font-semibold tracking-[-0.04em] text-foreground">benchline</span> : null}
    </Link>
  );
}
