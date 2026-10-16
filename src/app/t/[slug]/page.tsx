import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Cover } from "@/components/site/cover";
import { ToolActions } from "@/components/site/tool-actions";
import { ToolHost } from "@/components/site/tool-host";
import { FaqAccordion } from "@/components/kit/faq-accordion";
import { JsonLd, toolGraph } from "@/lib/jsonld";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import { COVER_SIZE, toolCover } from "@/lib/assets";
import { mcpFor } from "@/registry/mcp-index";
import { getCategory, getTool, relatedTools, tools, toolsInCategory } from "@/registry";

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  const title = tool.seo.ogTitle ?? tool.seo.title;
  return {
    title: tool.seo.title,
    description: tool.seo.description,
    keywords: [...tool.keywords],
    alternates: { canonical: `/t/${tool.slug}` },
    openGraph: {
      title,
      description: tool.seo.description,
      url: absoluteUrl(`/t/${tool.slug}`),
      images: [{ url: toolCover(tool.slug), ...COVER_SIZE, alt: tool.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: tool.seo.description,
      images: [toolCover(tool.slug)],
    },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();
  const category = getCategory(tool.category);
  const categoryName = category?.name ?? tool.category;
  const hue = category?.hue ?? 200;
  const siblings = toolsInCategory(tool.category);
  const related = relatedTools(slug);
  const mcp = mcpFor(tool.slug);
  return (
    <>
      <JsonLd data={toolGraph(tool, categoryName)} />
      <header className="flex flex-col gap-6 px-4 py-6 min-[700px]:flex-row min-[700px]:items-end min-[700px]:px-12 min-[700px]:py-10">
        <nav className="flex items-center gap-2 font-mono text-[12px] text-faint min-[700px]:hidden" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href={`/${tool.category}`}>{categoryName}</Link>
        </nav>
        <Cover hue={hue} icon={tool.icon} size={76} className="lgcv shadow-[var(--in-hi),inset_0_0_0_1px_var(--border),var(--shadow-2)]" />
        <div className="min-w-0 flex-1">
          <nav className="mb-3 hidden items-center gap-2 font-mono text-[12px] text-faint min-[700px]:flex" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href={`/${tool.category}`}>{categoryName}</Link>
            <span>/</span>
            <b className="font-medium text-foreground">{tool.name}</b>
          </nav>
          <h1 className="d2 text-[44px] min-[700px]:text-[72px]">{tool.name}</h1>
          <p className="lede mt-3 max-w-[62ch]">{tool.tagline}</p>
          {mcp ? (
            <p className="mt-3 font-mono text-[12px] text-faint">
              Use via MCP: {mcp.name}
              {mcp.openWorld ? " · this call can fetch a URL" : " · runs with the arguments you send"}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-start gap-3">
          <span className="chip">
            <span className={tool.runsLocally ? "dot" : "dot dot-warn"} />
            {tool.runsLocally ? "Runs locally" : "Fetches the URL you submit"}
          </span>
          <ToolActions slug={tool.slug} title={tool.name} />
        </div>
      </header>
      <div className="win mx-4 min-[700px]:mx-12">
        <div className="hidden border-r border-border bg-well min-[1280px]:block">
          <div className="bench-layout grid min-[1280px]:grid-cols-[248px_minmax(0,1fr)]">
            <nav className="border-r border-border bg-well p-3 dark:bg-sunken" aria-label="Tools in this category">
              <div className="px-2.5 pt-2 pb-1 font-mono text-[10.5px] tracking-[0.08em] text-faint uppercase">{categoryName}</div>
              {siblings.map((item) => (
                <Link
                  key={item.slug}
                  href={`/t/${item.slug}`}
                  className={item.slug === tool.slug ? "mt-0.5 flex items-center gap-2.5 rounded-lg bg-surface px-2.5 py-1.5 text-[13px] font-medium text-foreground shadow-[var(--in-hi),0_0_0_1px_var(--border),var(--shadow-1)] dark:bg-raised" : "mt-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] text-muted-foreground"}
                >
                  <Cover hue={hue} icon={item.icon} size={20} />
                  {item.name}
                </Link>
              ))}
            </nav>
            <Suspense fallback={<div className="h-48 animate-pulse bg-muted" />}>
              <ToolHost slug={tool.slug} />
            </Suspense>
          </div>
        </div>
        <div className="min-[1280px]:hidden">
          <Suspense fallback={<div className="h-48 animate-pulse bg-muted" />}>
            <ToolHost slug={tool.slug} />
          </Suspense>
        </div>
      </div>
      <section className="page-x grid gap-3 pt-16 min-[700px]:grid-cols-3 min-[700px]:gap-4 min-[700px]:pt-24">
        {tool.howTo.map((step, index) => (
          <article key={step.name} className="card p-6">
            <div className="font-mono text-[12px] text-faint">{String(index + 1).padStart(2, "0")}</div>
            <h2 className="mt-4 text-[18px] font-semibold tracking-[-0.03em]">{step.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
          </article>
        ))}
      </section>
      <section className="page-x grid gap-10 pt-16 pb-20 min-[1100px]:grid-cols-[220px_minmax(0,1fr)_320px] min-[1100px]:gap-16 min-[1100px]:pt-24">
        <nav className="text-[13.5px]" aria-label="On this page">
          <a href="#how-to" className="block border-l-[1.5px] border-foreground py-1.5 pl-3.5 text-foreground">How to</a>
          <a href="#questions" className="block border-l border-border py-1.5 pl-3.5 text-muted-foreground">Questions</a>
          <a href="#next" className="block border-l border-border py-1.5 pl-3.5 text-muted-foreground">Next</a>
        </nav>
        <div>
          <h2 id="how-to" className="h-panel">How to use it</h2>
          <p className="mt-4 max-w-[60ch] text-[15.5px] leading-7 text-muted-foreground">{tool.description}</p>
          <p className="mt-4 max-w-[60ch] text-[15.5px] leading-7 text-muted-foreground">
            In: {tool.inputs} Out: {tool.outputs}
          </p>
          <h2 id="questions" className="h-panel mt-12">Questions</h2>
          <FaqAccordion faqs={tool.faqs} />
        </div>
        <aside id="next">
          <div className="eyebrow">Next on the bench</div>
          <div className="mt-4 flex flex-col gap-3">
            {related.map((item) => {
              const itemCategory = getCategory(item.category);
              return (
                <Link key={item.slug} href={`/t/${item.slug}`} className="card flex items-center gap-3 p-3">
                  <Cover hue={itemCategory?.hue ?? 200} icon={item.icon} size={40} />
                  <span>
                    <span className="block text-sm font-semibold">{item.name}</span>
                    <span className="text-[12.5px] text-muted-foreground">{item.tagline}</span>
                  </span>
                </Link>
              );
            })}
          </div>
          {mcp ? (
            <p className="mt-6 font-mono text-[12px] leading-relaxed text-faint">
              POST {SITE_URL}/api/v1/tools/{tool.slug}
              <br />
              MCP {SITE_URL}/mcp · {mcp.name}
            </p>
          ) : null}
        </aside>
      </section>
    </>
  );
}
