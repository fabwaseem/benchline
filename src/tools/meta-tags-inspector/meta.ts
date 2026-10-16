import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "meta-tags-inspector",
  name: "Meta tags inspector",
  tagline: "Read title, description, canonical, robots, Open Graph, Twitter, and JSON-LD types from one public URL.",
  description:
    "Inspect a public page for title, description, canonical, robots, Open Graph, Twitter cards, and JSON-LD types. A checklist marks what social previews and AI search need.",
  category: "social",
  tags: ["meta-tags", "open-graph", "social-preview"],
  keywords: ["meta tags inspector", "Open Graph", "twitter card", "canonical", "JSON-LD", "og:image"],
  status: "new",
  createdAt: "2026-09-01",
  updatedAt: "2026-10-16",
  icon: "Tags",
  related: ["og-image-generator", "schema-generator", "ai-seo-checker", "llms-txt-generator"],
  faqs: [
    { q: "Does this change rankings?", a: "No. The inspector reports which tags are present and which usual ranges they fall in. It does not predict rankings or citations." },
    { q: "Which Open Graph tags does a preview need?", a: "og:title, og:description, og:image, and og:url. og:type tells the platform what the object is. Without og:image, most apps grab a random picture or show no image." },
    { q: "What is a useful twitter:card?", a: "summary_large_image when the page has a large preview, and summary when it does not. X still reads the Open Graph tags when the Twitter tags are missing." },
    { q: "Why list JSON-LD types?", a: "A JSON-LD block names the kind of page, such as Article or FAQPage. The inspector lists the types it found and does not judge the copy." },
    { q: "Does it run JavaScript?", a: "No. It reads the server HTML, which is also what most crawlers see. Client-rendered meta tags will not show." },
    { q: "Do you store URLs?", a: "No. The page is fetched to build the checklist and then discarded." },
  ],
  seo: {
    title: "Meta tags inspector",
    description: "Inspect a public page for title, description, canonical, robots, Open Graph, Twitter cards, and JSON-LD types.",
  },
  howTo: [
    { name: "Enter a public page URL", text: "A bare domain is fine. The server follows redirects, then reads the final HTML. Or switch to Write tags and edit a preview without a fetch." },
    { name: "Read the checklist", text: "Each row is a pass, a warning, or a fail for the title, description, canonical, robots, Open Graph, Twitter, and JSON-LD types." },
    { name: "Fix the warn and fail rows", text: "Start with a missing title, a noindex robots tag, and a missing og:image. Copy the fixed tags when you are ready." },
  ],
  inputs: "A public page URL, or title, description, image, and card fields in the editor.",
  outputs: "Platform previews, a checklist, and copy-ready meta tags plus a Next.js metadata object.",
  runsLocally: false,
  badges: ["Google · X · LinkedIn · Slack"],
} satisfies ToolMeta;
