import { absoluteUrl, SITE_URL } from "@/lib/site";
import { categories, tools } from "@/registry";

export function GET() {
  const sections = categories
    .map((category) => {
      const items = tools.filter((tool) => tool.category === category.slug);
      if (items.length === 0) return "";
      const links = items
        .map((tool) => `- [${tool.name}](${absoluteUrl(`/t/${tool.slug}`)}): ${tool.tagline}`)
        .join("\n");
      return `## ${category.name}\n\n${links}`;
    })
    .filter(Boolean)
    .join("\n\n");

  const body = `# Toolsmith

> A precise bench of developer tools for AI search, SEO, tokens, and shipping Next.js. Canonical site: ${SITE_URL}

${sections}

## Optional

- [About](${absoluteUrl("/about")}): who built the bench and what stays in the browser.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
