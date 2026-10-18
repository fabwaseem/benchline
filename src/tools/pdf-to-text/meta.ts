import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "pdf-to-text",
  name: "PDF to Text",
  tagline: "Read the selectable text of a PDF, with a markdown heading when the type is larger.",
  description:
    "Free PDF to text tool. Pull the text layer from each page, keep a rough markdown heading, and count tokens. Scanned pages without a text layer are left blank. This tool does not OCR. The file stays in the browser.",
  category: "pdf",
  tags: ["pdf", "text"],
  keywords: ["pdf to text", "pdf to markdown", "extract pdf text"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "FileType",
  related: ["pdf-to-image", "markdown-html", "html-to-markdown-url", "pdf-rotate-organize"],
  faqs: [
    { q: "Does this OCR a scan?", a: "No. It reads the text already stored in the PDF. A photo of a page comes back empty." },
    { q: "Is the PDF uploaded?", a: "No. The text layer is read in this browser." },
    { q: "How are headings chosen?", a: "A line that is clearly larger than the body text becomes a markdown heading. The rest stays as paragraphs." },
    { q: "What is the token count?", a: "It is an o200k_base count of the markdown, the same encoding the token counter uses." },
  ],
  seo: {
    title: "PDF to Text and Markdown",
    description: "Extract selectable PDF text in the browser. Per-page text, markdown headings, and a token count. No OCR.",
  },
  howTo: [
    { name: "Add a PDF", text: "Drop one PDF. It stays in this browser." },
    { name: "Read the text", text: "Each page is listed with its text. Larger lines become markdown headings." },
    { name: "Copy or download", text: "Copy the markdown or download it as a text file." },
  ],
  inputs: "One PDF.",
  outputs: "Plain text, markdown, a per-page breakdown, and a token count.",
  runsLocally: true,
  badges: ["No OCR"],
} satisfies ToolMeta;
