import type { Metadata } from "next";
import { Suspense } from "react";
import { DirectoryBrowser } from "@/components/shell/directory-browser";
import { DirectoryFrame } from "@/components/shell/directory-frame";
import { JsonLd, collectionGraph } from "@/lib/jsonld";
import { directoryCatalog } from "@/lib/catalog";
import { absoluteUrl, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE_NAME} — free browser tools`,
  description: "Search free browser tools for PDF, images, JSON, security, and SEO. Files stay on your device unless a tool fetches a public URL.",
  alternates: { canonical: "/" },
};

function DirectoryFallback() {
  return (
    <div className="px-4 py-6 lg:px-8" aria-hidden>
      <div className="h-8 w-40 animate-pulse rounded-md bg-sunken" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-xl border border-border bg-surface p-4">
            <div className="flex gap-3">
              <div className="size-10 rounded-sm bg-sunken" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 w-2/3 rounded-sm bg-sunken" />
                <div className="h-3 w-full rounded-sm bg-sunken" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { tools, categories, tags } = directoryCatalog();
  const description = "Free browser tools. Search, filter, and open one. Files stay on your device unless a tool fetches a public URL.";
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
      <DirectoryFrame categories={categories} total={tools.length} active="all">
        <Suspense fallback={<DirectoryFallback />}>
          <DirectoryBrowser tools={tools} categories={categories} tags={tags} />
        </Suspense>
      </DirectoryFrame>
    </>
  );
}
