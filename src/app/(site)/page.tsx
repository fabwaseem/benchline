import type { Metadata } from "next";
import { AgentBand } from "@/components/landing/agent-band";
import { CategoryGrid } from "@/components/landing/category-grid";
import { Hero } from "@/components/landing/hero";
import { PopularTools } from "@/components/landing/popular-tools";
import { PrivacyBand } from "@/components/landing/privacy-band";
import { JsonLd, collectionGraph } from "@/lib/jsonld";
import { directoryCatalog } from "@/lib/catalog";
import { absoluteUrl, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE_NAME}: free browser tools for web work`,
  description: "Free browser tools for PDF, images, JSON, security, and SEO. Files stay on your device, and every tool is callable from your AI agent over MCP.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const { tools, categories } = directoryCatalog();
  const popular = [...tools].sort((x, y) => x.popularity - y.popularity).slice(0, 8);
  const local = tools.filter((tool) => tool.runsLocally).length;
  const mcp = tools.filter((tool) => tool.mcpName).length;
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
      <Hero total={tools.length} local={local} mcp={mcp} />
      <CategoryGrid categories={categories} tools={tools} />
      <PopularTools tools={popular} total={tools.length} />
      <AgentBand endpoint={`${SITE_URL}/mcp`} total={tools.length} />
      <PrivacyBand local={local} network={tools.length - local} />
    </>
  );
}
