import type { Metadata } from "next";
import { Directory } from "@/components/site/directory";
import { JsonLd, collectionGraph } from "@/lib/jsonld";
import { absoluteUrl, SITE_NAME, SITE_URL } from "@/lib/site";
import { allTags, categories, searchRecords } from "@/registry";

const description =
  "Ten instruments for AI search, previews, tokens, and the files a Next.js deploy needs.";

export const metadata: Metadata = {
  title: `${SITE_NAME} — developer tools`,
  description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const tools = searchRecords();
  return (
    <>
      <JsonLd
        data={collectionGraph({
          url: SITE_URL,
          name: "Toolsmith directory",
          description,
          items: tools.map((tool) => ({ name: tool.name, url: absoluteUrl(`/t/${tool.slug}`) })),
        })}
      />
      <Directory tools={tools} categories={[...categories]} tags={allTags()} showHero />
    </>
  );
}
