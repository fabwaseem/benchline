import { toolMarkdown } from "@/lib/mcp/llms-doc";
import { absoluteUrl } from "@/lib/site";
import { tools } from "@/registry";

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

/** The Markdown copy of a tool page. Served at /t/<slug>.md through a rewrite in next.config.ts. */
export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const body = toolMarkdown(slug);
  if (!body) {
    return new Response("No tool uses that slug.\n", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  return new Response(body, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
      // The HTML page is the one to rank; this copy is for agents and LLM crawlers, so it stays crawlable.
      link: `<${absoluteUrl(`/t/${slug}`)}>; rel="canonical"`,
    },
  });
}
