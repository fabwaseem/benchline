import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "pdf-split",
  name: "Split PDF",
  tagline: "Extract a page range, or split a PDF into single pages or chunks, then download a PDF or a ZIP.",
  description:
    "Free split PDF tool. Extract pages with a range such as 1-3,5, save every page as its own PDF, or split every N pages. The work runs in the browser and the file is not uploaded. Several files download as a ZIP.",
  category: "pdf",
  tags: ["pdf", "split"],
  keywords: ["split pdf", "extract pdf pages", "pdf splitter"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Scissors",
  related: ["pdf-merge", "pdf-compress", "image-to-pdf", "qr-code-generator"],
  faqs: [
    { q: "Are the pages uploaded?", a: "No. The PDF is read and split in this browser. The download is built on this device." },
    { q: "How do I write a page range?", a: "Use page numbers from 1, separated by commas. 1-3,5 keeps pages 1, 2, 3, and 5. A blank box keeps every page." },
    { q: "What is the difference between the three modes?", a: "Extract builds one PDF from the range. Every page writes one PDF per selected page. Every N pages groups the selection into chunks." },
    { q: "Why do I get a ZIP?", a: "A single extract is one PDF. Every page and every N pages produce several PDFs, packed in a ZIP so you can download them together." },
  ],
  seo: {
    title: "Split PDF",
    description: "Split a PDF in your browser. Extract a page range, save every page, or cut every N pages. Download a PDF or a ZIP.",
  },
  howTo: [
    { name: "Add a PDF", text: "Drop one PDF. It stays in this browser." },
    { name: "Choose the pages and the mode", text: "Write a range, or leave it blank. Then extract one file, every page, or every N pages." },
    { name: "Download", text: "One result downloads as a PDF. Several results download as a ZIP." },
  ],
  inputs: "One PDF, a page range such as 1-3,5, and a mode: one file, every page, or every N pages.",
  outputs: "A PDF for a single extract, or a ZIP of PDFs when the split produces more than one file.",
  runsLocally: true,
  badges: ["PDF or ZIP"],
} satisfies ToolMeta;
