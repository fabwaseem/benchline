import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "markdown-html",
  name: "Markdown HTML",
  tagline: "Convert Markdown to HTML, or HTML back to Markdown, with a live preview.",
  description:
    "Free Markdown and HTML converter. GitHub-flavored Markdown in, HTML out, or the other way with Turndown. A sanitize switch strips scripts from the text output. The preview is always sanitized. Nothing is uploaded.",
  category: "markup",
  tags: ["markdown", "html"],
  keywords: ["markdown to html", "html to markdown", "gfm converter"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "FileCode",
  related: ["html-to-markdown-url", "json-yaml-convert", "diff-checker", "csv-json-convert"],
  faqs: [
    { q: "Which Markdown is supported?", a: "GitHub-flavored Markdown: tables, strikethrough, task lists, and fenced code." },
    { q: "What does sanitize do?", a: "It strips scripts, event handlers, and javascript: links from the converted text. The preview is sanitized even when the switch is off." },
    { q: "Is the text uploaded?", a: "No. Both directions run in this browser." },
    { q: "Can I start from a web page?", a: "Use HTML to Markdown from a URL for a public page. This tool converts the text you paste." },
  ],
  seo: {
    title: "Markdown to HTML and Back",
    description: "Convert GitHub-flavored Markdown to HTML or HTML to Markdown. Sanitize the output and preview it in the browser.",
  },
  howTo: [
    { name: "Paste the source", text: "Markdown or HTML. Pick the direction." },
    { name: "Choose sanitize", text: "On strips scripts from the text. The preview is always cleaned." },
    { name: "Copy the result", text: "Copy the converted text, or read the HTML preview." },
  ],
  inputs: "Markdown or HTML, a direction, and a sanitize switch.",
  outputs: "HTML or Markdown, plus a sanitized preview when the target is HTML.",
  runsLocally: true,
  badges: ["GFM"],
} satisfies ToolMeta;
