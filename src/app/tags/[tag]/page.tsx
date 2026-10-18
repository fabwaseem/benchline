import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DirectoryBrowser } from "@/components/shell/directory-browser";
import { DirectoryFrame } from "@/components/shell/directory-frame";
import { JsonLd, collectionGraph } from "@/lib/jsonld";
import { directoryCatalog } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/site";
import { allTags } from "@/registry";

export function generateStaticParams() {
  return allTags().map((tag) => ({ tag: tag.slug }));
}

export const unstable_paramMatching = { tag: "not-found" };

function label(slug: string) {
  return slug.replace(/-/g, " ");
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const known = allTags().find((item) => item.slug === tag);
  if (!known) notFound();
  const description = `Tools tagged ${label(tag)}.`;
  return {
    title: `#${label(tag)}`,
    description,
    alternates: { canonical: `/tags/${tag}` },
    robots: known.count < 3 ? { index: false, follow: true } : undefined,
    openGraph: { url: absoluteUrl(`/tags/${tag}`), title: `#${label(tag)}`, description },
  };
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const known = allTags().find((item) => item.slug === tag);
  if (!known) notFound();
  const catalog = directoryCatalog();
  const list = catalog.tools.filter((tool) => tool.tags.includes(tag));
  return (
    <>
      <JsonLd
        data={collectionGraph({
          url: absoluteUrl(`/tags/${tag}`),
          name: `#${label(tag)}`,
          description: `Tools tagged ${label(tag)}.`,
          items: list.map((tool) => ({ name: tool.name, url: absoluteUrl(`/t/${tool.slug}`) })),
        })}
      />
      <DirectoryFrame categories={catalog.categories} total={catalog.tools.length} active="all">
        <div className="px-4 pt-6 lg:px-8">
          <p className="font-mono text-[11px] tracking-[0.08em] text-faint uppercase">Tag</p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em]">#{label(tag)}</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">
            {known.count} {known.count === 1 ? "tool" : "tools"} with this tag.
            {known.count < 3 ? " This page is not indexed." : ""}
          </p>
        </div>
        <Suspense fallback={<div className="mx-4 mt-5 h-40 animate-pulse rounded-xl bg-sunken lg:mx-8" />}>
          <DirectoryBrowser
            tools={catalog.tools}
            categories={catalog.categories}
            tags={catalog.tags}
            lockedTag={tag}
            mode="embedded"
            searchPlaceholder={`Search #${label(tag)}`}
          />
        </Suspense>
      </DirectoryFrame>
    </>
  );
}
