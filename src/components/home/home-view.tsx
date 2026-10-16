import { Suspense } from "react";
import { CtaBand } from "@/components/home/cta-band";
import { Bento } from "@/components/home/bento";
import { DemoWindow } from "@/components/home/demo-window";
import { HeroStage } from "@/components/home/hero-stage";
import { HeroStill } from "@/components/home/hero-still";
import type { Category, SearchRecord } from "@/registry/schema";

export function HomeView({ categories, tools }: { categories: Category[]; tools: SearchRecord[] }) {
  const local = tools.filter((tool) => tool.runsLocally).length;
  const stats = [
    { value: String(tools.length), label: "Tools on the bench, each with tests" },
    { value: String(categories.length), label: "Categories, with room for more" },
    { value: String(local), label: "Generators that stay in the browser" },
    { value: "0 B", label: "Of your data stored on our side" },
  ];
  return (
    <>
      <HeroStage toolCount={tools.length} still={<HeroStill />} />
      <div className="border-b border-border">
      <div className="frame grid grid-cols-2 min-[700px]:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="border-r border-b border-border px-4 py-6 last:border-r-0 min-[700px]:border-b-0 min-[700px]:px-12 min-[700px]:py-9">
            <div className="font-mono text-[32px] leading-none font-medium tracking-[-0.06em] min-[700px]:text-[44px]">{stat.value}</div>
            <div className="mt-2.5 text-[13.5px] text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>
      </div>
      <Section n="01" kicker="Try it" title="Real tools." dim="Right here." lede="Every tool is a full instrument, not a demo. Paste a token and it decodes and verifies here, inside this tab." />
      <Suspense fallback={<div className="page-x h-80" />}>
        <DemoWindow />
      </Suspense>
      <Section n="02" kicker="On the bench" title="Every tool," dim="sharpened." lede="From OG cards to robots.txt. Each one is fast, keyboard-first, and honest about what it touches." />
      <Bento />
      <CtaBand />
      <div className="h-16 min-[700px]:h-[120px]" />
    </>
  );
}

function Section({
  id,
  n,
  kicker,
  title,
  dim,
  lede,
}: {
  id?: string;
  n: string;
  kicker: string;
  title: string;
  dim: string;
  lede: string;
}) {
  return (
    <div id={id} className="page-x grid items-end gap-4 pt-16 pb-7 min-[700px]:grid-cols-2 min-[700px]:gap-12 min-[700px]:pt-[120px] min-[700px]:pb-12">
      <div>
        <div className="eyebrow">
          <span className="text-faint">{n}</span>
          {kicker}
        </div>
        <h2 className="d2 mt-4">
          {title}
          <br />
          <span className="text-faint">{dim}</span>
        </h2>
      </div>
      <p className="lede max-w-[46ch] min-[700px]:justify-self-end">{lede}</p>
    </div>
  );
}
