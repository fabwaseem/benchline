import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "pdf-rotate-organize",
  name: "Rotate PDF",
  tagline: "Reorder, rotate, or drop pages, then download the PDF.",
  description:
    "Free rotate and organize PDF tool. Drag pages into a new order, turn a page by 90 degrees, or delete a page. Thumbnails are drawn in the browser. The file is not uploaded.",
  category: "pdf",
  tags: ["pdf", "rotate"],
  keywords: ["rotate pdf", "reorder pdf pages", "delete pdf pages"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "RotateCw",
  related: ["pdf-split", "pdf-merge", "pdf-to-image", "pdf-protect-unlock"],
  faqs: [
    { q: "Are the pages uploaded?", a: "No. Thumbnails and the new PDF are built in this browser." },
    { q: "Can I rotate one page?", a: "Yes. Each card turns 90 degrees. The other pages stay as they are." },
    { q: "What if the thumbnail does not appear?", a: "The page number is still there. You can reorder and rotate from the number." },
    { q: "Does this unlock a password?", a: "No. An encrypted PDF has to be unlocked first." },
  ],
  seo: {
    title: "Rotate and Reorder PDF Pages",
    description: "Rotate, reorder, or delete PDF pages in the browser. Download the organized PDF. Nothing is uploaded.",
  },
  howTo: [
    { name: "Add a PDF", text: "Drop one PDF. A card appears for each page." },
    { name: "Arrange the pages", text: "Drag to reorder, turn a card, or remove a page." },
    { name: "Download", text: "The new PDF uses the order and rotation on screen." },
  ],
  inputs: "One PDF, plus the page order, rotation, and which pages to keep.",
  outputs: "One PDF.",
  runsLocally: true,
  badges: ["In the browser"],
} satisfies ToolMeta;
