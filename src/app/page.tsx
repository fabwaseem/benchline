import type { Metadata } from "next";
import { HomeView } from "@/components/home/home-view";
import { JsonLd, collectionGraph } from "@/lib/jsonld";
import { absoluteUrl, SITE_NAME, SITE_URL } from "@/lib/site";
import { categories, searchRecords } from "@/registry";

const description = "A quiet bench of precise, free browser tools for people who ship the web.";

export const metadata: Metadata = {
  title: `${SITE_NAME} — exact tools for the web`,
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
          name: "Benchline",
          description,
          items: tools.map((tool) => ({ name: tool.name, url: absoluteUrl(`/t/${tool.slug}`) })),
        })}
      />
      <HomeView categories={[...categories]} tools={tools} />
    </>
  );
}
