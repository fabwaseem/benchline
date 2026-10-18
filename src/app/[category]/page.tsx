import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { CategoryHeader } from "@/components/shell/category-header";
import { DirectoryBrowser } from "@/components/shell/directory-browser";
import { DirectoryFrame } from "@/components/shell/directory-frame";
import { FaqAccordion } from "@/components/kit/faq-accordion";
import { Cover } from "@/components/site/cover";
import { JsonLd, collectionGraph } from "@/lib/jsonld";
import { directoryCatalog } from "@/lib/catalog";
import { categoryFaqs } from "@/lib/directory";
import { absoluteUrl } from "@/lib/site";
import { categoryParams, resolveListing } from "@/lib/taxonomy";

export function generateStaticParams() {
  return categoryParams();
}

export const unstable_paramMatching = { category: "not-found" };

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: slug } = await params;
  const listing = resolveListing(slug);
  if (!listing) notFound();
  if (listing.kind === "redirect") {
    return { alternates: { canonical: listing.href } };
  }
  return {
    title: `${listing.name} tools`,
    description: listing.description,
    alternates: { canonical: `/${listing.slug}` },
    openGraph: { url: absoluteUrl(`/${listing.slug}`), title: `${listing.name} tools`, description: listing.description },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const listing = resolveListing(slug);
  if (!listing) notFound();
  if (listing.kind === "redirect") redirect(listing.href);
  const catalog = directoryCatalog();
  const list = catalog.tools.filter((tool) => tool.category === listing.filter || tool.parent === listing.filter);
  const local = list.filter((tool) => tool.runsLocally).length;
  const mcp = list.filter((tool) => tool.mcpName).length;
  const faqs = categoryFaqs({ name: listing.name, total: list.length, local, sampleMcp: list.find((tool) => tool.mcpName)?.mcpName ?? null });
  const related = catalog.categories.filter((item) => !item.match.includes(slug)).slice(0, 3);
  return (
    <>
      <JsonLd
        data={collectionGraph({
          url: absoluteUrl(`/${listing.slug}`),
          name: `${listing.name} tools`,
          description: listing.description,
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
        <CategoryHeader
          name={listing.name}
          description={listing.description}
          icon={listing.icon}
          hue={listing.hue}
          count={list.length}
          localCount={local}
          mcpCount={mcp}
          breadcrumbs={listing.breadcrumbs}
          chips={listing.chips}
          activeChip={listing.activeChip}
          parentSlug={listing.parentSlug}
        />
        <Suspense fallback={<div className="mx-4 mt-5 h-40 animate-pulse rounded-xl bg-sunken lg:mx-8" />}>
          <DirectoryBrowser
            tools={catalog.tools}
            categories={catalog.categories}
            tags={catalog.tags}
            lockedCategory={listing.filter}
            defaultView="list"
            mode="embedded"
            searchPlaceholder={`Search ${listing.name} tools`}
          />
        </Suspense>
        <section className="px-4 pb-6 lg:px-8">
          <h2 className="font-mono text-[11px] tracking-[0.08em] text-faint uppercase">Related categories</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {related.map((item) => (
              <Link key={item.slug} href={`/${item.slug}`} className="lift flex items-center gap-3 rounded-xl border border-border bg-surface p-3 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                <Cover hue={item.hue} icon={item.icon} size={36} />
                <span>
                  <span className="block text-[14px] font-medium">{item.name}</span>
                  <span className="font-mono text-[12px] text-faint tabular-nums">{item.count} {item.count === 1 ? "tool" : "tools"}</span>
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
