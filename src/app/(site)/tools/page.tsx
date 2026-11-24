import type { Metadata } from "next";
import { Suspense } from "react";
import { DirectoryBrowser } from "@/components/shell/directory-browser";
import { DirectoryFrame } from "@/components/shell/directory-frame";
import { JsonLd, collectionGraph } from "@/lib/jsonld";
import { directoryCatalog } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/site";

const description = "Every Benchline tool in one place. Search by name, filter by where it runs, whether it speaks MCP, or by tag.";

export const metadata: Metadata = {
  title: "All tools",
  description,
  alternates: { canonical: "/tools" },
  openGraph: { url: absoluteUrl("/tools"), title: "All tools", description },
};

function DirectoryFallback() {
  return (
    <div className="py-8 lg:pl-8" aria-hidden>
      <div className="h-10 w-full max-w-md animate-pulse rounded-md bg-sunken" />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }, (_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-xl border border-border bg-surface" />
        ))}
      </div>
    </div>
  );
}

export default function ToolsPage() {
  const { tools, categories, tags } = directoryCatalog();
  return (
    <>
      <JsonLd
        data={collectionGraph({
          url: absoluteUrl("/tools"),
          name: "All tools",
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
