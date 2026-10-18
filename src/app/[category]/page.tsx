import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CategoryHeader } from "@/components/shell/category-header";
import { DirectoryBrowser } from "@/components/shell/directory-browser";
import { DirectoryFrame } from "@/components/shell/directory-frame";
import { FaqAccordion } from "@/components/kit/faq-accordion";
import { Cover } from "@/components/site/cover";
import { JsonLd, collectionGraph } from "@/lib/jsonld";
import { directoryCatalog } from "@/lib/catalog";
import { categoryFaqs } from "@/lib/directory";
import { absoluteUrl } from "@/lib/site";
import { categories, getCategory } from "@/registry";

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.slug }));
}

export const unstable_paramMatching = { category: "not-found" };

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  return {
    title: `${category.name} tools`,
    description: category.description,
    alternates: { canonical: `/${category.slug}` },
    openGraph: { url: absoluteUrl(`/${category.slug}`), title: `${category.name} tools`, description: category.description },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  const catalog = directoryCatalog();
  const nav = catalog.categories.find((item) => item.slug === slug);
  if (!nav) notFound();
  const list = catalog.tools.filter((tool) => tool.category === slug);
  const local = list.filter((tool) => tool.runsLocally).length;
  const mcp = list.filter((tool) => tool.mcpName).length;
  const faqs = categoryFaqs({ name: category.name, total: list.length, local, sampleMcp: list.find((tool) => tool.mcpName)?.mcpName ?? null });
  const related = catalog.categories.filter((item) => item.slug !== slug).slice(0, 3);
  return (
    <>
      <JsonLd
        data={collectionGraph({
          url: absoluteUrl(`/${category.slug}`),
          name: `${category.name} tools`,
          description: category.description,
          items: list.map((tool) => ({ name: tool.name, url: absoluteUrl(`/t/${tool.slug}`) })),
        })}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
          })),
        }}
      />
      <DirectoryFrame categories={catalog.categories} total={catalog.tools.length} active={slug}>
        <CategoryHeader category={nav} localCount={local} mcpCount={mcp} />
        <Suspense fallback={<div className="mx-4 mt-5 h-40 animate-pulse rounded-xl bg-sunken lg:mx-8" />}>
          <DirectoryBrowser
            tools={catalog.tools}
            categories={catalog.categories}
            tags={catalog.tags}
            lockedCategory={slug}
            defaultView="list"
            mode="embedded"
            searchPlaceholder={`Search ${category.name} tools`}
          />
        </Suspense>
        <section className="px-4 pb-6 lg:px-8">
          <h2 className="font-mono text-[11px] tracking-[0.08em] text-faint uppercase">Related categories</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {related.map((item) => (
              <Link key={item.slug} href={`/${item.slug}`} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-colors duration-150 hover:border-border-strong">
                <Cover hue={item.hue} icon={item.icon} size={36} />
                <span>
                  <span className="block text-[14px] font-medium">{item.name}</span>
                  <span className="font-mono text-[12px] text-faint">{item.count} {item.count === 1 ? "tool" : "tools"}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
        <section className="px-4 pb-16 lg:px-8">
          <h2 className="mb-2 text-[15px] font-medium">FAQ</h2>
          <FaqAccordion faqs={faqs} />
        </section>
      </DirectoryFrame>
    </>
  );
}
