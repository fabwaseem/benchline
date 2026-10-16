import Link from "next/link";
import { cn } from "@/lib/utils";

function Mark({ tone }: { tone: "light" | "dark" }) {
  const tile = tone === "light" ? "#16130F" : "#F6F4EF";
  const ink = tone === "light" ? "#F6F4EF" : "#16130F";
  const work = tone === "light" ? "#E8590C" : "#F2702A";
  return (
    <svg viewBox="0 0 32 32" className="size-6 shrink-0" aria-hidden>
      <rect width="32" height="32" rx="8" fill={tile} />
      <g transform="translate(0,-2.5)">
        <rect x="6" y="19" width="20" height="2.6" rx="0.6" fill={ink} />
        <rect x="8.5" y="21" width="2.4" height="5" rx="0.5" fill={ink} />
        <rect x="21.1" y="21" width="2.4" height="5" rx="0.5" fill={ink} />
        <rect x="16" y="11" width="7" height="7" rx="1" fill={work} />
        <rect x="8.5" y="15.4" width="5" height="2.6" rx="0.6" fill={ink} opacity="0.45" />
      </g>
    </svg>
  );
}

export function Logo({ className, word = true }: { className?: string; word?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5 text-[17px] font-semibold tracking-[-0.04em]", className)}>
      <span className="dark:hidden">
        <Mark tone="light" />
      </span>
      <span className="hidden dark:block">
        <Mark tone="dark" />
      </span>
      {word ? <span>benchline</span> : <span className="sr-only">Benchline</span>}
    </Link>
  );
}
