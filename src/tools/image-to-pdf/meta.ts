import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "image-to-pdf",
  name: "Image to PDF",
  tagline: "Turn JPG, PNG, and WebP images into one PDF. Set the page size, orientation, margin, and order.",
  description:
    "Free JPG to PDF and image to PDF converter. Drop JPG, PNG, or WebP pictures, put them in order, and choose A4, Letter, or a page that fits the picture. Portrait, landscape, or automatic orientation, with a margin. The PDF is built in the browser and the images are not uploaded.",
  category: "pdf",
  tags: ["pdf", "image", "convert"],
  keywords: ["jpg to pdf converter", "image to pdf converter", "png to pdf"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "FileImage",
  related: ["pdf-merge", "pdf-split", "pdf-compress", "qr-code-generator"],
  faqs: [
    { q: "Are the images uploaded?", a: "No. JPG and PNG are embedded in this browser. WebP is drawn to a canvas here and then embedded as PNG. Nothing is uploaded." },
    { q: "What does Fit mean?", a: "Fit makes each page the same shape as its image, with the long edge the length of an A4 page. A4 and Letter put the image on a standard page and center it." },
    { q: "How does automatic orientation work?", a: "A wide image uses a landscape page. A tall image uses portrait. You can force either one." },
    { q: "Can I reorder the pages?", a: "Yes. The PDF follows the list from top to bottom. Move a row with the arrows or by dragging it." },
  ],
  seo: {
    title: "Image to PDF",
    description: "Convert JPG, PNG, and WebP images to one PDF in your browser. Choose A4, Letter, or fit, then set orientation, margin, and order.",
  },
  howTo: [
    { name: "Add images", text: "Drop JPG, PNG, or WebP files. They stay in this browser." },
    { name: "Set size, orientation, and margin", text: "Pick A4, Letter, or Fit. Auto follows each image, or force portrait or landscape." },
    { name: "Download the PDF", text: "The pages follow the list order. One image becomes one page." },
  ],
  inputs: "JPG, PNG, or WebP images, their order, a page size, an orientation, and a margin.",
  outputs: "One PDF with one page per image.",
  runsLocally: true,
  badges: ["JPG · PNG · WebP"],
} satisfies ToolMeta;
