"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { openCommandK } from "@/components/site/open-command";
import { GITHUB_URL } from "@/lib/site";

export function CtaBand() {
  return (
    <div className="page-x pt-16 min-[700px]:pt-[120px]">
      <div className="grid items-center gap-10 overflow-hidden rounded-3xl bg-gradient-to-b from-surface to-well px-6 py-10 shadow-[var(--in-hi),0_0_0_1px_var(--border),var(--shadow-2)] min-[900px]:grid-cols-[1.2fr_1fr] min-[900px]:px-16 min-[900px]:py-[88px]">
        <div>
          <div className="eyebrow">Get to work</div>
          <h2 className="d2 mt-4">
            Press ⌘K.
            <br />
            <span className="text-faint">Skip the rest.</span>
          </h2>
          <p className="lede mt-5 max-w-[40ch]">Every tool is two keystrokes away, on every page. No account, no tracking, no limits.</p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            <Link href="/explore" className="btn-ink btn btn-lg">
              Browse all tools <ArrowRight size={15} strokeWidth={1.75} />
            </Link>
            <a className="btn btn-lg" href={`${GITHUB_URL}/issues/new`}>
              Request a tool
            </a>
          </div>
        </div>
        <div className="flex justify-center gap-3.5">
          <button type="button" className="kc" onClick={() => openCommandK()} aria-label="Command">
            ⌘
          </button>
          <button type="button" className="kc text-[40px]" onClick={() => openCommandK()} aria-label="K">
            K
          </button>
        </div>
      </div>
    </div>
  );
}
