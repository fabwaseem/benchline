import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "llms-txt-generator",
  name: "llms.txt generator",
  tagline: "Read a public sitemap and write an llms.txt index, plus an optional llms-full.txt.",
  description:
    "Generate a spec-compliant llms.txt and an optional llms-full.txt from a public sitemap, with an editable preview.",
  category: "ai-search",
  tags: ["llms-txt", "sitemap", "ai-crawlers"],
  keywords: ["llms.txt", "llms.txt generator", "llms-full.txt", "llmstxt", "AI crawlers"],
  status: "stable",
  createdAt: "2026-03-01",
  updatedAt: "2026-10-16",
  icon: "FileText",
  related: ["ai-seo-checker", "robots-txt-checker", "og-image-generator", "schema-generator"],
  faqs: [
    {
      q: "What is llms.txt?",
      a: "llms.txt is a markdown file, usually at /llms.txt, that gives agents a short index of a site. The format at llmstxt.org asks for an H1, a blockquote summary, then H2 sections of markdown links. An Optional section holds links an agent can skip.",
    },
    {
      q: "What is llms-full.txt?",
      a: "llms-full.txt is an expanded companion. This generator fills it with the same pages plus a short plain-text excerpt of each one. The short index stays in llms.txt.",
    },
    {
      q: "How are the sections chosen?",
      a: "Pages are grouped from the URL path: docs, blog, API, product, and about each get a section. Privacy, terms, and account pages go under Optional, which the spec treats as secondary.",
    },
    {
      q: "Can I edit the file before downloading it?",
      a: "Yes. The preview is a text area. Change the copy, then copy it or download llms.txt and llms-full.txt.",
    },
    {
      q: "Which pages get left out?",
      a: "Only public http and https URLs are fetched. Private, loopback, and link-local addresses are refused. The generator keeps at most 30 pages, and it skips files that are not HTML pages.",
    },
  ],
  seo: {
    title: "llms.txt generator",
    description:
      "Generate a spec-compliant llms.txt and an optional llms-full.txt from a public sitemap, with an editable preview.",
  },
  howTo: [
    { name: "Enter a site or paste URLs", text: "Submit one public site URL, or switch to manual mode and paste up to 30 page URLs." },
    { name: "Read the sitemap", text: "The server fetches robots.txt and sitemap.xml, including Sitemap entries in robots.txt. If those are missing, it collects links from the homepage." },
    { name: "Review and download", text: "Titles and meta descriptions are grouped into sections. Edit the preview, then copy or download llms.txt and the optional llms-full.txt." },
  ],
  inputs: "A public site URL, or up to 30 page URLs pasted by hand.",
  outputs: "An editable llms.txt index and an llms-full.txt file with short excerpts.",
  runsLocally: false,
  badges: ["llms.txt · llms-full.txt"],
} satisfies ToolMeta;
