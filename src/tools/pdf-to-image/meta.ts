import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "pdf-to-image",
  name: "PDF to Image",
  tagline: "Render PDF pages to PNG or JPEG, then download one image or a ZIP.",
  description:
    "Free PDF to image tool. Pick PNG or JPEG, a DPI from 72 to 216, and a page range. One page downloads as an image. Several pages download as a ZIP. The render runs in this browser.",
  category: "pdf",
  tags: ["pdf", "image"],
  keywords: ["pdf to jpg", "pdf to png", "pdf to image"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "FileImage",
  related: ["pdf-to-text", "pdf-split", "image-convert", "pdf-compress"],
  faqs: [
    { q: "Which pages are rendered?", a: "A blank range renders every page, up to 24. 1-3,5 keeps those pages." },
    { q: "Why is there a page limit?", a: "Each page becomes a bitmap. Twenty-four pages, or 25 MB of images, is the cap so the tab stays responsive." },
    { q: "Is the PDF uploaded?", a: "No. The pages are drawn in this browser." },
    { q: "What is the ZIP?", a: "One page is a single PNG or JPEG. More than one page is packed in a ZIP." },
  ],
  seo: {
    title: "PDF to JPG or PNG",
    description: "Turn PDF pages into PNG or JPEG in the browser. Choose DPI and a page range. Download an image or a ZIP.",
  },
  howTo: [
    { name: "Add a PDF", text: "Drop one PDF. It stays in this browser." },
    { name: "Choose the format", text: "Pick PNG or JPEG, a DPI, and a page range." },
    { name: "Download", text: "One page is an image. Several pages arrive as a ZIP." },
  ],
  inputs: "One PDF, a format, a DPI from 72 to 216, a page range, and a JPEG quality.",
  outputs: "A PNG or JPEG, or a ZIP when more than one page is rendered.",
  runsLocally: true,
  badges: ["PNG or ZIP"],
} satisfies ToolMeta;
