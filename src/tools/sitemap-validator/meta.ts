import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "sitemap-validator",
  name: "Sitemap validator",
  tagline: "Check a sitemap URL or XML, or generate a urlset from a list.",
  description:
    "Free XML sitemap checker. Fetch a public sitemap, or paste XML, and see URL counts, lastmod problems, and a sample of HTTP statuses. Generate a urlset from a list of URLs. Private addresses are refused.",
  category: "seo",
  tags: ["sitemap", "seo"],
  keywords: ["sitemap checker", "sitemap generator", "xml sitemap validator"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "FileSearch",
  related: ["robots-txt-checker", "ai-seo-checker", "schema-generator", "meta-tags-inspector"],
  faqs: [
    { q: "Does a fetch follow a sitemap index?", a: "Yes, up to three child sitemaps. Each response is capped, and only a sample of page URLs is requested for status." },
    { q: "Are private URLs fetched?", a: "No. A location on a private or loopback address is reported and skipped." },
    { q: "Can I generate a sitemap without fetching?", a: "Yes. The Generate tab builds XML in the browser from one URL per line." },
  ],
  seo: {
    title: "XML sitemap validator and generator",
    description: "Validate a sitemap URL or XML file, check lastmod, and generate a urlset.",
  },
  howTo: [
    { name: "Paste a URL or XML", text: "A URL is fetched on the server. XML is checked in the browser." },
    { name: "Read the notes", text: "Missing dates, future dates, duplicates, and private locations are listed." },
    { name: "Or generate one", text: "One absolute URL per line becomes a urlset you can download." },
  ],
  inputs: "A public sitemap URL, sitemap XML, or a list of page URLs.",
  outputs: "URL counts, issues, a sample of HTTP statuses, and generated XML.",
  runsLocally: false,
  badges: ["URL · XML · Generate"],
} satisfies ToolMeta;
