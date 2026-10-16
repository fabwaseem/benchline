import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "robots-txt-checker",
  name: "robots.txt checker",
  tagline: "Read allow and disallow rules, sitemap links, and the mistakes that make a robots.txt file lie.",
  description:
    "Fetch a public robots.txt, list Allow and Disallow rules and sitemap links, and flag common mistakes. Private addresses are blocked.",
  category: "ai-search",
  tags: ["robots-txt", "sitemap", "ai-crawlers"],
  keywords: ["robots.txt checker", "robots.txt", "sitemap", "disallow", "crawler rules"],
  status: "new",
  createdAt: "2026-09-01",
  updatedAt: "2026-10-16",
  icon: "Shield",
  related: ["ai-seo-checker", "llms-txt-generator", "meta-tags-inspector", "schema-generator"],
  faqs: [
    { q: "Does a Disallow hide a page?", a: "No. robots.txt asks a polite crawler not to fetch a path. The URL can still be linked, shared, and indexed. Do not use it as a lock on private content." },
    { q: "What if robots.txt is missing?", a: "A 404 means there is no file. Crawlers treat that as allow all. Add a file if you want a Sitemap line or a rule for a specific agent." },
    { q: "Why flag a relative Sitemap?", a: "The robots.txt spec requires each Sitemap value to be an absolute URL. A path such as /sitemap.xml is not a valid Sitemap line." },
    { q: "Which mistakes matter most?", a: "A response that is HTML instead of a robots file, User-agent * with Disallow /, and a Sitemap value that is not absolute. Those three change what crawlers are allowed to fetch or find." },
  ],
  seo: {
    title: "robots.txt checker",
    description: "Fetch a public robots.txt, list Allow and Disallow rules and sitemap links, and flag common mistakes. Private addresses are blocked.",
  },
  howTo: [
    { name: "Enter a domain or a robots.txt URL", text: "A bare domain is fetched at /robots.txt. A URL that already ends in robots.txt is fetched as written." },
    { name: "Read the groups", text: "Each User-agent lists Allow and Disallow paths. Sitemap lines are listed separately. You can also paste a file and audit it locally." },
    { name: "Fix the flagged rows", text: "Start with fails: a file that is HTML, a User-agent * that disallows the whole site, and a Sitemap that is not an absolute URL." },
  ],
  inputs: "A public domain, a robots.txt URL, or a pasted robots.txt file.",
  outputs: "User-agent groups, sitemap links, and pass, warn, or fail rows for common mistakes.",
  runsLocally: false,
} satisfies ToolMeta;
