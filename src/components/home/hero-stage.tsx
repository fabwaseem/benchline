"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { ArrowRight, Eye, Search, Zap } from "lucide-react";
import { Button } from "@/components/kit/primitives/button";
import { Kbd } from "@/components/kit/kbd";
import { Cover } from "@/components/site/cover";
import { GithubMark } from "@/components/site/github-mark";
import { openCommandK } from "@/components/site/open-command";
import { GITHUB_URL } from "@/lib/site";

const BenchCanvas = dynamic(() => import("@/components/home/bench-canvas").then((mod) => mod.BenchCanvas), {
  ssr: false,
});

function useMedia(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

// Spec v2 §12–13: 3D is desktop/tablet only, skipped on low-end or save-data devices, and loads on idle after LCP.
function useDeferred3d(enabled: boolean) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    if (nav.connection?.saveData || (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 2) return;
    let handle = 0;
    const schedule = () => {
      const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
      handle = idle(() => setReady(true), { timeout: 2500 } as IdleRequestOptions) as number;
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      window.removeEventListener("load", schedule);
      (window.cancelIdleCallback ?? window.clearTimeout)(handle);
    };
  }, [enabled]);
  return ready;
}

function useClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function HeroStage({ toolCount, still }: { toolCount: number; still: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const mounted = useClient();
  const mobile = useMedia("(max-width: 699px)");
  const reducedMotion = useMedia("(prefers-reduced-motion: reduce)");
  const reducedTransparency = useMedia("(prefers-reduced-transparency: reduce)");
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if (reducedMotion) return;
    let timer = window.setTimeout(() => setIdle(true), 8000);
    const wake = () => {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), 8000);
    };
    window.addEventListener("pointermove", wake);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", wake);
    };
  }, [reducedMotion]);
  const dark = mounted && resolvedTheme === "dark";
  const ready3d = useDeferred3d(mounted && !reducedMotion && !mobile);
  const showCanvas = ready3d && !mobile;
  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] min-[700px]:inset-0 min-[700px]:h-auto" aria-hidden>
        {still}
        {showCanvas ? (
          <BenchCanvas dark={dark} still={idle} solid={reducedTransparency} mobile={mobile} />
        ) : null}
      </div>
      <div
        className="pointer-events-none absolute inset-0 max-[699px]:bg-[linear-gradient(0deg,var(--background)_0,var(--background)_calc(100%-420px),transparent_calc(100%-300px))] min-[700px]:bg-[linear-gradient(90deg,var(--background)_0,color-mix(in_oklch,var(--background)_70%,transparent)_34%,transparent_52%),linear-gradient(0deg,var(--background)_0,transparent_18%)]"
        aria-hidden
      />
      <div className="frame relative max-[699px]:pb-10 min-[700px]:h-[860px]">
      <div className="relative px-4 pt-[372px] min-[700px]:absolute min-[700px]:top-28 min-[700px]:left-12 min-[700px]:w-[760px] min-[700px]:px-0 min-[700px]:pt-0">
        <Link href="/t/ai-token-counter" className="plate inline-flex h-[30px] items-center gap-2.5 rounded-full pr-3 pl-1 text-[13px] text-fg2 shadow-[var(--in-hi),0_0_0_1px_var(--border),var(--shadow-1)]">
          <b className="rounded-full bg-foreground px-2 py-0.5 font-mono text-[10.5px] font-medium tracking-[0.06em] text-background">16 OCT</b>
          Token prices now cover GPT-6.1 Sol, Claude Sonnet 5.5, and Gemini 4 Argon
          <ArrowRight size={13} strokeWidth={1.75} />
        </Link>
        <h1 className="d1 mt-7">
          A quiet bench
          <br />
          <span className="text-faint">for exact work.</span>
        </h1>
        <p className="lede mt-7 max-w-[44ch]">
          Precise, free browser tools for developers and marketers who ship the web. No signup, no ads, and every checker tells you exactly what it fetches.
        </p>
        <Button type="button" variant="outline" className="mt-9 h-control-lg w-full max-w-[560px] justify-start gap-3 px-4 text-[15.5px] font-normal text-faint" onClick={() => openCommandK()}>
          <Search size={18} strokeWidth={1.75} />
          <span className="truncate">Search {toolCount} tools, or paste a JWT…</span>
          <span className="ml-auto flex gap-0.5">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </Button>
        <div className="mt-3.5 flex flex-wrap gap-2.5">
          <a className="btn btn-brand" href="#bench">
            Open the bench <ArrowRight size={15} strokeWidth={1.75} />
          </a>
          <a className="btn btn-lg" href={GITHUB_URL}>
            <GithubMark size={15} /> GitHub
          </a>
        </div>
        <div className="mt-7 flex flex-wrap gap-x-7 gap-y-2.5 text-[13px] text-muted-foreground">
          <span className="inline-flex items-center gap-2"><Zap size={14} strokeWidth={1.75} /> No account</span>
          <span className="inline-flex items-center gap-2"><Eye size={14} strokeWidth={1.75} /> Open source</span>
        </div>
      </div>
      <div className="hfloat glass absolute right-[430px] bottom-16 hidden w-[236px] rounded-[14px] p-3.5 shadow-[var(--in-hi),0_0_0_1px_var(--glass-border),var(--shadow-2)] min-[1100px]:block">
        <div className="flex items-center gap-2.5">
          <span className="text-success">✓</span>
          <div>
            <div className="text-[13px] font-semibold">Signature verified</div>
            <div className="font-mono text-[11px] text-faint">HS256</div>
          </div>
        </div>
      </div>
      <div className="hfloat glass absolute right-12 bottom-12 hidden w-[360px] overflow-hidden rounded-[14px] shadow-[var(--in-hi),0_0_0_1px_var(--glass-border),var(--shadow-2)] min-[1100px]:block">
        <div className="flex items-center gap-2 px-3.5 py-2.5 text-[13px]">
          <Search size={14} strokeWidth={1.75} />
          <span>jwt</span>
          <span className="keycap ml-auto">esc</span>
        </div>
        <PreviewRow hue={150} icon="KeyRound" name="JWT decoder" meta="↵" selected />
        <PreviewRow hue={185} icon="FileText" name="llms.txt generator" meta="AI search" />
        <PreviewRow hue={75} icon="Coins" name="AI token counter" meta="AI dev" />
        <PreviewRow hue={300} icon="Image" name="OG image generator" meta="Social" />
      </div>
      </div>
    </section>
  );
}

function PreviewRow({ hue, icon, name, meta, selected = false }: { hue: number; icon: string; name: string; meta: string; selected?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 border-t border-border px-3.5 py-2 text-[13px]" style={selected ? { background: "color-mix(in oklch, var(--foreground) 4%, transparent)", boxShadow: "inset 2px 0 0 var(--accent-brand)" } : undefined}>
      <Cover hue={hue} icon={icon} size={24} />
      <span className="flex-1 font-medium">{name}</span>
      <span className="font-mono text-[11.5px] text-faint">{meta}</span>
    </div>
  );
}

