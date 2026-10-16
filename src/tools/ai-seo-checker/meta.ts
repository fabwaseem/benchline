import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "ai-seo-checker",
  name: "AI SEO checker",
  tagline: "Score crawler access, llms.txt, structured data, and the on-page signals AI search uses.",
  description:
    "Score a public URL for AI crawlers, llms.txt, sitemap, JSON-LD, metadata, headings, and answer-first content.",
  category: "ai-search",
  tags: ["ai-crawlers", "llms-txt", "seo"],
  keywords: ["AI SEO checker", "GPTBot", "llms.txt", "JSON-LD", "robots.txt", "AI crawlers"],
  status: "stable",
  createdAt: "2026-03-01",
  updatedAt: "2026-10-16",
  icon: "Search",
  related: ["llms-txt-generator", "robots-txt-checker", "meta-tags-inspector", "schema-generator"],
  faqs: [
    {
      q: "What does the score measure?",
      a: "The score is a weighted mix of pass, warn, and fail checks: HTTPS, response time, title, description, canonical, Open Graph, headings, an answer-first lead, JSON-LD, llms.txt, sitemap, and robots.txt rules for the major AI crawlers.",
    },
    {
      q: "Which crawlers are checked?",
      a: "GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended, CCBot, and Applebot-Extended should be allowed if you want citation and training visibility. Bytespider should be blocked.",
    },
    {
      q: "Why is Bytespider treated differently?",
      a: "Bytespider is a high-volume scraper. The checker passes when robots.txt disallows it, and warns when the file never mentions it.",
    },
    {
      q: "Does a high score guarantee rankings?",
      a: "No. The checker reports whether a page is readable by AI crawlers and whether the usual on-page signals are present. It does not predict rankings or citations.",
    },
  ],
  seo: {
    title: "AI SEO checker",
    description: "Score a public URL for AI crawlers, llms.txt, sitemap, JSON-LD, metadata, headings, and answer-first content.",
  },
  howTo: [
    { name: "Enter a public URL", text: "Paste the page you want to check. The server follows redirects, then reads the final HTML." },
    { name: "Read the discovery files", text: "The checker fetches robots.txt, /llms.txt, and the sitemap referenced by the site or by /sitemap.xml." },
    { name: "Fix the warn and fail rows", text: "Each row explains the result. Start with fails, then warnings." },
  ],
  inputs: "One public page URL. A bare domain is accepted.",
  outputs: "A score and a pass, warn, or fail row for each signal, plus a copyable report.",
  runsLocally: false,
} satisfies ToolMeta;
