import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { McpSnippet } from "@/components/shell/mcp-snippet";
import { RelatedTools } from "@/components/shell/related-tools";
import { ToolHeader } from "@/components/shell/tool-header";
import { ToolWorkspace } from "@/components/shell/tool-workspace";
import { FaqAccordion } from "@/components/kit/faq-accordion";
import { ToolHost } from "@/components/site/tool-host";
import { JsonLd, toolGraph } from "@/lib/jsonld";
import { absoluteUrl } from "@/lib/site";
import { COVER_SIZE, toolCover } from "@/lib/assets";
import { mcpFor } from "@/registry/mcp-index";
import { categories, getCategory, getTool, relatedTools, tools } from "@/registry";

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export const unstable_paramMatching = { slug: "not-found" };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();
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

function WorkspaceSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden>
      <div className="h-12 border-b border-border bg-sunken" />
      <div className="grid min-h-72 md:grid-cols-2">
        <div className="border-b border-border bg-surface md:border-r md:border-b-0" />
        <div className="bg-well" />
      </div>
    </div>
  );
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();
  const category = getCategory(tool.category);
  const categoryName = category?.name ?? tool.category;
  const hue = category?.hue ?? 200;
  const related = relatedTools(slug);
  const mcp = mcpFor(tool.slug);
  const hues = Object.fromEntries(categories.map((item) => [item.slug, item.hue]));
  return (
    <>
      <JsonLd data={toolGraph(tool, categoryName)} />
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 lg:px-8">
        <ToolHeader
          name={tool.name}
          tagline={tool.tagline}
          categorySlug={tool.category}
          categoryName={categoryName}
          hue={hue}
          icon={tool.icon}
          runsLocally={tool.runsLocally}
          mcpName={mcp?.name ?? null}
          slug={tool.slug}
        />
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            <ToolWorkspace>
              <Suspense fallback={<WorkspaceSkeleton />}>
                <ToolHost slug={tool.slug} />
              </Suspense>
            </ToolWorkspace>
            <p className="mt-8 max-w-[68ch] text-[15px] leading-7 text-muted-foreground">{tool.description}</p>
            <section id="how-to" className="mt-8">
              <h2 className="text-[15px] font-medium">How to use it</h2>
              <ol className="mt-3 grid gap-3 sm:grid-cols-3">
                {tool.howTo.map((step, index) => (
                  <li key={step.name} className="rounded-xl border border-border bg-surface p-4">
                    <span className="font-mono text-[11px] text-faint">{String(index + 1).padStart(2, "0")}</span>
                    <p className="mt-2 text-[14px] font-medium">{step.name}</p>
                    <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{step.text}</p>
                  </li>
                ))}
              </ol>
            </section>
            <section id="questions" className="mt-10">
              <h2 className="mb-2 text-[15px] font-medium">FAQ</h2>
              <FaqAccordion faqs={tool.faqs} />
            </section>
          </div>
          <aside id="next" className="flex flex-col gap-4 lg:sticky lg:top-20">
            <RelatedTools tools={related} hues={hues} />
            {mcp ? <McpSnippet name={mcp.name} /> : null}
          </aside>
        </div>
      </div>
    </>
  );
}
