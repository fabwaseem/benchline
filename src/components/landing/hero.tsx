import Link from "next/link";
import { ArrowRight } from "kineticons";
import { HeroSearch } from "@/components/landing/hero-search";
import { Workbench } from "@/components/landing/workbench";

export function Hero({ total, local, mcp }: { total: number; local: number; mcp: number }) {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden border-b border-border">
      <div aria-hidden className="ground-grid absolute inset-0 -z-10 [mask-image:radial-gradient(90%_80%_at_70%_30%,#000_30%,transparent_80%)]" />
      <div aria-hidden className="ground-glow absolute inset-0 -z-10" />
      <div className="page-x frame grid min-h-[min(calc(100svh-3.75rem),880px)] items-center gap-12 py-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] lg:gap-14 lg:py-16">
        <div data-enter className="max-w-[680px]">
          <p className="kicker">
            <span className="dot" aria-hidden />
            {total} free tools · no signup
          </p>
          <h1 id="hero-title" className="d1 mt-5">
            The browser toolbench for people who <span className="mark-lime">ship the web.</span>
          </h1>
          <p className="mt-6 max-w-[54ch] text-[17px] leading-[1.6] text-muted-foreground md:text-[18px]">
            Format JSON, compress a PDF, decode a JWT, audit a page for AI search. Your files stay on this device, and every tool answers your AI agent over MCP.
          </p>
          <div className="mt-8 flex max-w-[600px] flex-col gap-3 sm:flex-row">
            <HeroSearch total={total} />
            <Link
              href="/tools"
              className="ki-trigger arrow-nudge inline-flex h-control-lg shrink-0 items-center justify-center gap-2 rounded-md bg-brand px-5 text-[14.5px] font-semibold text-brand-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.16),var(--shadow-1)] transition-[transform,background-color] duration-150 hover:bg-[color-mix(in_srgb,var(--accent-brand)_88%,var(--foreground))] active:translate-y-px focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
            >
              Browse all tools
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
          <Link href="/mcp/guide" className="u-draw mt-4 inline-block text-[14.5px] font-medium text-brand-text focus-visible:outline-none">
            Or connect your AI agent over MCP →
          </Link>
          <dl className="mt-10 flex max-w-[480px] divide-x divide-border">
            <Stat value={total} label="tools" />
            <Stat value={local} label="in browser" />
            <Stat value={mcp} label="MCP ready" />
          </dl>
        </div>
        <Workbench />
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-1 flex-col-reverse px-5 first:pl-0">
      <dt className="mt-1 text-[13px] text-muted-foreground">{label}</dt>
      <dd className="text-[32px] leading-none font-semibold tracking-[-0.04em] tabular-nums">{value}</dd>
    </div>
  );
}
