import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "html-to-markdown-url",
  name: "Page to Markdown",
  tagline: "Fetch a public page and turn the article into Markdown.",
  description:
    "Free HTML to Markdown tool for a public URL. The page is fetched on the server, private addresses are refused, and Readability keeps the article. Navigation and scripts are stripped. The result includes a token count.",
  category: "ai-search",
  tags: ["markdown", "html"],
  keywords: ["url to markdown", "html to markdown", "readability markdown"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Globe",
  related: ["markdown-html", "meta-tags-inspector", "ai-seo-checker", "llms-txt-generator"],
  faqs: [
    { q: "Which pages can I fetch?", a: "Public http and https URLs. Local, private, and link-local addresses are refused." },
    { q: "What is removed?", a: "Scripts, navigation, and other chrome when Readability can find the article. The Markdown is the article, not the whole page." },
    { q: "How large can the page be?", a: "The fetch stops at 800 KB. Larger responses are refused." },
    { q: "What is the token count?", a: "An o200k_base count of the Markdown." },
  ],
  seo: {
    title: "URL to Markdown",
    description: "Fetch a public page and convert the article to Markdown. Private addresses are blocked. Includes a token count.",
  },
  howTo: [
    { name: "Paste a public URL", text: "http or https. Private addresses are refused." },
    { name: "Fetch the article", text: "The server downloads the page and keeps the readable part." },
    { name: "Copy the Markdown", text: "The article, the title, and a token count." },
  ],
  inputs: "One public page URL.",
  outputs: "Markdown, a title, an excerpt, and a token count.",
  runsLocally: false,
  badges: ["Public URL"],
} satisfies ToolMeta;
