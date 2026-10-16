import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryBrowser } from "@/components/site/category-browser";
import { JsonLd, collectionGraph } from "@/lib/jsonld";
import { absoluteUrl } from "@/lib/site";
import { allTags, toolsWithTag } from "@/registry";

export function generateStaticParams() {
  return allTags().map((tag) => ({ tag: tag.slug }));
}

function label(slug: string) {
  return slug.replace(/-/g, " ");
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const known = allTags().find((item) => item.slug === tag);
  if (!known) return {};
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
  const list = toolsWithTag(tag);
  const related = allTags().filter((item) => item.slug !== tag && list.some((tool) => tool.tags.includes(item.slug))).slice(0, 8);
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
      <header className="border-b border-border px-4 py-10 min-[700px]:px-12 min-[700px]:py-16">
        <nav className="flex items-center gap-2 font-mono text-[12px] text-faint">
          <Link href="/">Home</Link>
          <span>/</span>
          <b className="font-medium text-foreground">#{tag}</b>
        </nav>
        <div className="mt-8 flex items-end gap-5">
          <span className="cover grid size-16 place-items-center font-mono text-2xl text-faint" style={{ borderRadius: 16 }}>#</span>
          <h1 className="d1 text-[64px] min-[700px]:text-[96px]">{label(tag)}</h1>
        </div>
        <p className="lede mt-5">Tools that share this tag. {known.count < 3 ? "This page is not indexed." : ""}</p>
        {related.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {related.map((item) => (
              <Link key={item.slug} href={`/tags/${item.slug}`} className="chip">#{item.slug}</Link>
            ))}
          </div>
        ) : null}
      </header>
      <CategoryBrowser
        hue={200}
        updated={Object.fromEntries(list.map((tool) => [tool.slug, tool.updatedAt]))}
        tools={list.map((tool) => ({
          slug: tool.slug,
          name: tool.name,
          tagline: tool.tagline,
          description: tool.description,
          category: tool.category,
          tags: [...tool.tags],
          keywords: [...tool.keywords],
          status: tool.status,
          icon: tool.icon,
          runsLocally: tool.runsLocally,
          updatedAt: tool.updatedAt,
        }))}
      />
    </>
  );
}
