import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "pdf-merge",
  name: "Merge PDF",
  tagline: "Combine PDFs in the browser. Reorder them, keep a page range from each file, and download one document.",
  description:
    "Free PDF merger. Combine PDFs in the browser, drag them into order, and keep a page range such as 1-3,5 from each file. The merge runs on this device. The files are not uploaded.",
  category: "pdf",
  tags: ["pdf", "merge"],
  keywords: ["pdf merger", "merge pdf", "combine pdf"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Files",
  related: ["pdf-split", "image-to-pdf", "pdf-compress", "qr-code-generator"],
  faqs: [
    { q: "Are the PDFs uploaded?", a: "No. The page reads the files in this browser and builds the merged PDF here. Nothing is sent to a server." },
    { q: "Can I merge only some pages?", a: "Yes. Each file has a page box. Leave it blank to keep every page, or write a list such as 1-3,5. Pages are numbered from 1." },
    { q: "What if a PDF is password protected?", a: "Encrypted files are refused. Remove the password in a reader that already has it, then merge the unlocked file." },
    { q: "How many files can I add?", a: "Up to 25 PDFs, and each file up to 40 MB. Reorder them with the arrow buttons or by dragging a row." },
  ],
  seo: {
    title: "Merge PDF",
    description: "Merge PDF files in your browser. Reorder documents, pick page ranges, and download one PDF. Files stay on this device.",
  },
  howTo: [
    { name: "Add the PDFs", text: "Drop two or more PDFs. They stay in this browser." },
    { name: "Order them and set ranges", text: "Move a row up or down. Leave the page box blank, or write 1-3,5." },
    { name: "Download the merged file", text: "Merge writes one PDF. The page count is the sum of the pages you kept." },
  ],
  inputs: "Two or more PDFs, their order, and an optional page range for each file.",
  outputs: "One PDF containing the selected pages, in the order of the list.",
  runsLocally: true,
  badges: ["In this browser"],
} satisfies ToolMeta;
