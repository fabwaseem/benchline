import { Suspense } from "react";
import { CodeViewer } from "@/components/kit/code-viewer";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Cover } from "@/components/site/cover";
import { CronSample } from "@/components/home/cron-sample";
import { SpotCard } from "@/components/home/spot-card";
import { buildDockerfile, dockerfileDefaults, estimatedSize } from "@/tools/nextjs-dockerfile-generator/lib/dockerfile";
import { renderLlmsTxt } from "@/tools/llms-txt-generator/lib/llms";
import { scoreSeo } from "@/tools/ai-seo-checker/lib/score";
import { parseRobots } from "@/lib/robots";
import { inspectHtml } from "@/tools/meta-tags-inspector/lib/meta";
import { countTokens } from "@/tools/ai-token-counter/lib/tokenize";
import { money, priceSelected } from "@/tools/ai-token-counter/lib/cost";
import { DEFAULT_MODEL_IDS } from "@/tools/ai-token-counter/lib/prices";

const samplePrompt = "Summarise this changelog for a release tweet. Keep it under 280 characters and mention the new llms.txt validator.";

const sampleHtml = `<html><head><title>Benchline — exact browser tools</title>
<meta name="description" content="A quiet bench of precise browser tools.">
<meta property="og:title" content="Benchline — exact browser tools">
<meta property="og:image" content="https://tools.fabwaseem.com/opengraph-image">
</head><body><h1>Benchline</h1></body></html>`;

export function Bento() {
  const tokens = countTokens(samplePrompt, "o200k");
  const prices = priceSelected({
    ids: [...DEFAULT_MODEL_IDS],
    inputTokens: tokens.count,
    outputTokens: 80,
    cachedRatio: 0,
    requestsPerDay: 1,
  });
  const docker = buildDockerfile(dockerfileDefaults).split("\n").slice(0, 4);
  const llms = renderLlmsTxt("Benchline", "Exact tools for people who ship the web.", [
    { url: "https://tools.fabwaseem.com/t/jwt-decoder", title: "JWT decoder", description: "Read and verify a token in the browser.", excerpt: "" },
  ]);
  const seo = scoreSeo({
    finalUrl: "https://example.com/docs",
    status: 200,
    elapsedMs: 180,
    title: "Benchline docs for exact work",
    description: "A description long enough to sit in a snippet without being cut off halfway through the sentence.",
    canonical: "https://example.com/docs",
    robotsMeta: "",
    ogTitle: "Benchline docs",
    ogDescription: "Exact tools for people who ship the web.",
    ogImage: "https://example.com/og.png",
    headings: [{ level: 1, text: "Benchline" }],
    lead: "Benchline is a free bench of precise browser tools for developers who ship the web.",
    jsonLdTypes: ["FAQPage"],
    llmsStatus: 200,
    sitemapFound: true,
    robots: parseRobots("User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml\nUser-agent: GPTBot\nAllow: /\n"),
  });
  const meta = inspectHtml(sampleHtml, "https://tools.fabwaseem.com/");
  const checks = seo.checks.slice(0, 3);
  return (
    <div className="page-x grid grid-cols-1 gap-3 min-[700px]:grid-cols-12 min-[700px]:gap-4">
      <SpotCard href="/t/og-image-generator" className="min-[700px]:col-span-7 min-[700px]:row-span-2" tilt>
        <Head hue={300} icon="Image" title="OG image generator" meta="Social previews · in browser" />
        <div className="mt-5 grid flex-1 gap-4 min-[800px]:grid-cols-[1fr_200px]">
          <div className="relative flex aspect-[1200/630] flex-col overflow-hidden rounded-xl bg-foreground p-6 text-background">
            <div className="font-mono text-[11px] tracking-[0.06em] text-background/60">BENCHLINE · BLOG</div>
            <div className="mt-auto max-w-[13ch] text-[clamp(22px,2.4vw,34px)] leading-none font-semibold tracking-[-0.045em]">How we ship OG cards that never break.</div>
            <div className="mt-3.5 flex gap-2.5 font-mono text-[12px] text-background/55"><span>Benchline</span><span>·</span><span>Sample card</span></div>
          </div>
          <div className="hidden flex-col min-[800px]:flex">
            <div className="font-mono text-[11px] tracking-[0.07em] text-faint uppercase">Card</div>
            <div className="field mt-2 text-foreground">How we ship OG cards…</div>
            <div className="mt-2.5 flex gap-1.5">
              {["oklch(17.5% .006 265)", "oklch(98.9% .0015 250)", "oklch(32% .03 250)", "oklch(40% .02 80)"].map((color, index) => (
                <span key={color} className="size-[26px] rounded-[7px] shadow-[inset_0_0_0_1px_var(--border-strong)]" style={{ background: color, outline: index === 0 ? "2px solid var(--foreground)" : undefined, outlineOffset: 2 }} />
              ))}
            </div>
            <div className="mt-4 font-mono text-[11px] tracking-[0.07em] text-faint uppercase">Export</div>
            <div className="mt-2 flex gap-1.5"><span className="chip">PNG</span><span className="chip">opengraph-image.tsx</span></div>
            <div className="mt-auto font-mono text-[11.5px] text-faint">1200 × 630</div>
          </div>
        </div>
      </SpotCard>
      <SpotCard href="/t/ai-token-counter" className="min-[700px]:col-span-5 min-[700px]:row-span-2">
        <Head hue={75} icon="Coins" title="AI token counter" meta="AI dev · in browser" />
        <div className="well mt-4 p-3.5 text-[13px] leading-relaxed text-fg2">{samplePrompt}</div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {prices.map((row) => (
            <div key={row.model.id} className="well p-3">
              <div className="font-mono text-[11.5px] text-faint">{row.model.label}</div>
              <div className="mt-1 font-mono text-[20px] tracking-[-0.04em]">{tokens.count.toLocaleString("en-US")}</div>
              <div className="font-mono text-[11px] text-faint">{money(row.requestUsd)}</div>
            </div>
          ))}
        </div>
        <div className="mt-auto flex justify-between pt-3.5 font-mono text-[11.5px] text-faint">
          <span>o200k sample · {tokens.words} words</span>
        </div>
      </SpotCard>
      <SpotCard href="/t/cron-expression-builder" className="min-[700px]:col-span-4">
        <Head hue={200} icon="Clock" title="Cron expression builder" meta="Developer" />
        <Suspense fallback={<p className="mt-4 font-mono text-[20px] tracking-[-0.03em]">*/15 9-17 * * 1-5</p>}>
          <CronSample />
        </Suspense>
      </SpotCard>
      <SpotCard href="/t/ai-seo-checker" className="min-[700px]:col-span-4">
        <Head hue={185} icon="Search" title="AI SEO checker" meta="AI search · sample page" />
        <div className="mt-4 flex items-center gap-4">
          <div className="relative size-[84px]">
            <svg viewBox="0 0 36 36" className="size-[84px]" aria-hidden>
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--border)" strokeWidth="2.4" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--foreground)" strokeWidth="2.4" strokeDasharray={`${seo.score} 100`} strokeLinecap="round" transform="rotate(-90 18 18)" />
            </svg>
            <div className="absolute inset-0 grid place-items-center font-mono text-[24px] tracking-[-0.05em]">{seo.score}</div>
          </div>
          <div className="flex flex-col gap-1.5 text-[12.5px] text-fg2">
            {checks.map((check) => (
              <span key={check.id}>{check.level === "pass" ? "Pass" : check.level === "warn" ? "Warn" : "Fail"} · {check.label}</span>
            ))}
          </div>
        </div>
      </SpotCard>
      <SpotCard href="/t/robots-txt-checker" className="min-[700px]:col-span-4">
        <Head hue={185} icon="Shield" title="robots.txt checker" meta="AI search" />
        <CodeViewer className="mt-4" code={"User-agent: GPTBot\nAllow: /blog/\nDisallow: /admin/"} label="robots.txt" language="ini" maxHeight={140} dense />
      </SpotCard>
      <SpotCard href="/t/meta-tags-inspector" className="min-[700px]:col-span-4">
        <Head hue={300} icon="Tags" title="Meta tags inspector" meta="Social previews" />
        <div className="mt-4 grid grid-cols-[96px_1fr] overflow-hidden rounded-[11px] shadow-[inset_0_0_0_1px_var(--border)]">
          <div className="bg-foreground" />
          <div className="p-2.5">
            <div className="font-mono text-[10.5px] text-faint">SAMPLE HTML</div>
            <div className="mt-0.5 text-[13px] font-semibold">{meta.title}</div>
            <div className="text-[12px] text-muted-foreground">{meta.checks.length} checks on the fixture</div>
          </div>
        </div>
      </SpotCard>
      <SpotCard href="/t/nextjs-dockerfile-generator" className="min-[700px]:col-span-4">
        <Head hue={0} icon="Container" title="Next.js Dockerfile generator" meta="Next.js" />
        <CodeViewer className="mt-4" code={docker.join("\n")} label="Dockerfile" language="dockerfile" maxHeight={160} dense />
        <p className="mt-2 font-mono text-[12px] text-faint">{estimatedSize(dockerfileDefaults)}</p>
      </SpotCard>
      <SpotCard href="/t/llms-txt-generator" className="min-[700px]:col-span-4">
        <Head hue={185} icon="FileText" title="llms.txt generator" meta="AI search" />
        <CodeViewer className="mt-4" code={llms.split("\n").slice(0, 4).join("\n")} label="llms.txt" language="markdown" maxHeight={140} dense />
      </SpotCard>
      <Link href="/t/schema-generator" className="sr-only">Schema generator</Link>
    </div>
  );
}

function Head({ hue, icon, title, meta }: { hue: number; icon: string; title: string; meta: string }) {
  return (
    <div className="flex items-center gap-3">
      <Cover hue={hue} icon={icon} size={34} />
      <div className="min-w-0">
        <div className="text-[15px] font-semibold tracking-[-0.02em]">{title}</div>
        <div className="font-mono text-[11.5px] text-faint">{meta}</div>
      </div>
      <span className="ml-auto grid size-[30px] place-items-center rounded-lg text-faint shadow-[inset_0_0_0_1px_var(--border)]">
        <ArrowRight size={14} strokeWidth={1.75} />
      </span>
    </div>
  );
}
