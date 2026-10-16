import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Directory } from "@/components/site/directory";
import { JsonLd, collectionGraph } from "@/lib/jsonld";
import { asRecord } from "@/lib/records";
import { absoluteUrl } from "@/lib/site";
import { allTags, categories, toolsWithTag } from "@/registry";

export function generateStaticParams() {
  return allTags().map((tag) => ({ tag: tag.slug }));
}

function label(slug: string) {
  return slug.replace(/-/g, " ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const known = allTags().some((item) => item.slug === tag);
  if (!known) return {};
  const description = `Tools tagged ${label(tag)}.`;
  return {
    title: label(tag),
    description,
    alternates: { canonical: `/tags/${tag}` },
    openGraph: { url: absoluteUrl(`/tags/${tag}`), title: label(tag), description },
  };
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const known = allTags().find((item) => item.slug === tag);
  if (!known) notFound();
  const tools = toolsWithTag(tag).map(asRecord);
  return (
    <>
      <JsonLd
        data={collectionGraph({
          url: absoluteUrl(`/tags/${tag}`),
          name: label(tag),
          description: `Tools tagged ${label(tag)}.`,
          items: tools.map((tool) => ({ name: tool.name, url: absoluteUrl(`/t/${tool.slug}`) })),
        })}
      />
      <header className="mb-6">
        <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">Tag</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{label(tag)}</h1>
        <p className="mt-2 text-sm text-muted-foreground tabular-nums">{known.count} tools</p>
      </header>
      <Directory tools={tools} categories={[...categories]} tags={allTags()} lockedTag={tag} />
    </>
  );
}
