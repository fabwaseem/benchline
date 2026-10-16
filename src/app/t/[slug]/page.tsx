import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { ToolCard } from "@/components/site/tool-card";
import { ToolHost } from "@/components/site/tool-host";
import { FaqAccordion } from "@/components/kit/faq-accordion";
import { JsonLd, toolGraph } from "@/lib/jsonld";
import { asRecord } from "@/lib/records";
import { absoluteUrl } from "@/lib/site";
import { getCategory, getTool, relatedTools, tools } from "@/registry";

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
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
    },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();
  const category = getCategory(tool.category);
  const categoryName = category?.name ?? tool.category;
  const related = relatedTools(slug).map(asRecord);
  return (
    <>
      <JsonLd data={toolGraph(tool, categoryName)} />
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <Breadcrumbs
            items={[
              { href: "/", label: "Home" },
              { href: `/${tool.category}`, label: categoryName },
              { href: `/t/${tool.slug}`, label: tool.name },
            ]}
          />
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{tool.name}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{tool.tagline}</p>
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground">In</span> {tool.inputs}
            <span className="mx-2 text-border">/</span>
            <span className="text-foreground">Out</span> {tool.outputs}
          </p>
        </header>
        <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-muted" />}>
          <ToolHost slug={tool.slug} />
        </Suspense>
        <section id="how-to" className="max-w-2xl">
          <h2 className="text-sm font-semibold tracking-tight">How to use it</h2>
          <ol className="mt-3 flex flex-col gap-3">
            {tool.howTo.map((step, index) => (
              <li key={step.name} className="flex gap-3 text-sm">
                <span className="tabular-nums text-muted-foreground">{index + 1}</span>
                <span>
                  <span className="font-medium">{step.name}</span>
                  <span className="mt-1 block text-muted-foreground">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
        <section className="max-w-2xl">
          <h2 className="text-sm font-semibold tracking-tight">Questions</h2>
          <div className="mt-3">
            <FaqAccordion faqs={tool.faqs} />
          </div>
        </section>
        {related.length > 0 ? (
          <section>
            <h2 className="text-sm font-semibold tracking-tight">Related</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <ToolCard
                  key={item.slug}
                  tool={item}
                  categoryName={getCategory(item.category)?.name ?? item.category}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
