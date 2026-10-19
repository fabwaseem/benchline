import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AgentSection, HowItWorks, RelatedTools, ToolCard, ToolHeader, ToolPage } from "@/components/kit/shell";
import { ToolHost } from "@/components/site/tool-host";
import { directoryCatalog } from "@/lib/catalog";
import { JsonLd, toolGraph } from "@/lib/jsonld";
import { exampleArguments, toolsCallParams } from "@/lib/mcp/example";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import { COVER_SIZE, toolCover } from "@/lib/assets";
import { mcpFor } from "@/registry/mcp-index";
import { mcpToolBySlug } from "@/registry/mcp-registry";
import { getTool, relatedTools, tools } from "@/registry";
import { parentHue, resolveListing } from "@/lib/taxonomy";

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export const unstable_paramMatching = { slug: "not-found" };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();
  const title = tool.seo.ogTitle ?? tool.seo.title;
  return {
    title: tool.seo.title,
    description: tool.seo.description,
    keywords: [...tool.keywords],
    alternates: { canonical: `/t/${tool.slug}` },
    openGraph: {
      title,
      description: tool.seo.description,
      url: absoluteUrl(`/t/${tool.slug}`),
      images: [{ url: toolCover(tool.slug), ...COVER_SIZE, alt: tool.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: tool.seo.description,
      images: [toolCover(tool.slug)],
    },
  };
}

function WorkspaceSkeleton() {
  return (
    <ToolCard>
      <div className="animate-pulse" aria-hidden>
        <div className="flex h-12 items-center gap-2 border-b border-border px-3">
          <div className="h-6 w-16 rounded-[4px] bg-sunken" />
          <div className="h-6 w-16 rounded-[4px] bg-sunken" />
        </div>
        <div className="grid min-h-72 grid-cols-1 min-[900px]:grid-cols-2">
          <div className="space-y-2 border-b border-border p-4 min-[900px]:border-r min-[900px]:border-b-0">
            <div className="h-3 w-1/3 rounded-[4px] bg-sunken" />
            <div className="h-3 w-2/3 rounded-[4px] bg-sunken" />
            <div className="h-3 w-1/2 rounded-[4px] bg-sunken" />
          </div>
          <div className="p-4">
            <div className="h-3 w-1/4 rounded-[4px] bg-sunken" />
          </div>
        </div>
      </div>
    </ToolCard>
  );
}

export default async function ToolScreen({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();
  const listing = resolveListing(tool.category);
  const categoryName = listing?.kind === "page" ? listing.name : tool.category;
  const parent =
    listing?.kind === "page" && listing.breadcrumbs.length > 2
      ? { href: listing.breadcrumbs[1]?.href ?? "/", label: listing.breadcrumbs[1]?.label ?? "" }
      : null;
  const hue = listing?.kind === "page" ? listing.hue : parentHue(tool.category);
  const categorySlug = listing?.kind === "page" ? listing.slug : tool.category;
  const catalogTools = directoryCatalog().tools;
  const related = relatedTools(slug).flatMap((item) => {
    const match = catalogTools.find((entry) => entry.slug === item.slug);
    return match ? [match] : [];
  });
  const mcp = mcpFor(tool.slug);
  const mcpTool = mcpToolBySlug(tool.slug);
  const call = mcp && mcpTool
    ? JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: toolsCallParams(mcp.name, exampleArguments(mcpTool.inputSchema)) }, null, 2)
    : null;
  const crumbs =
    listing?.kind === "page"
      ? listing.breadcrumbs.slice(1).map((item) => ({ name: item.label, href: item.href }))
      : undefined;
  return (
    <>
      <JsonLd data={toolGraph(tool, categoryName, crumbs)} />
      <ToolPage>
        <ToolHeader
          name={tool.name}
          tagline={tool.tagline}
          categorySlug={categorySlug}
          categoryName={categoryName}
          parent={parent}
          hue={hue}
          icon={tool.icon}
          runsLocally={tool.runsLocally}
          mcpName={mcp?.name ?? null}
          slug={tool.slug}
        />
        <div className="mt-6">
          <Suspense fallback={<WorkspaceSkeleton />}>
            <ToolHost slug={tool.slug} />
          </Suspense>
        </div>
        {mcp && call ? (
          <div className="mt-8">
            <AgentSection name={mcp.name} endpoint={`${SITE_URL}/mcp`} call={call} />
          </div>
        ) : null}
        <div className="mt-10">
          <RelatedTools tools={related} />
        </div>
        <div className="mt-10">
          <HowItWorks description={tool.description} steps={tool.howTo} faqs={tool.faqs} />
        </div>
      </ToolPage>
    </>
  );
}
