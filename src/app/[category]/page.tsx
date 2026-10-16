import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Directory } from "@/components/site/directory";
import { JsonLd, collectionGraph } from "@/lib/jsonld";
import { asRecord } from "@/lib/records";
import { absoluteUrl } from "@/lib/site";
import { allTags, categories, getCategory, toolsInCategory } from "@/registry";

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: `/${category.slug}` },
    openGraph: { url: absoluteUrl(`/${category.slug}`), title: category.name, description: category.description },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  const tools = toolsInCategory(slug).map(asRecord);
  const tags = allTags().filter((tag) => tools.some((tool) => tool.tags.includes(tag.slug)));
  return (
    <>
      <JsonLd
        data={collectionGraph({
          url: absoluteUrl(`/${category.slug}`),
          name: category.name,
          description: category.description,
          items: tools.map((tool) => ({ name: tool.name, url: absoluteUrl(`/t/${tool.slug}`) })),
        })}
      />
      <header className="mb-6">
        <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">Category</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{category.name}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{category.description}</p>
      </header>
      <Directory tools={tools} categories={[...categories]} tags={tags} lockedCategory={category.slug} />
    </>
  );
}
