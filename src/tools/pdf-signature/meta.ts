import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "pdf-signature",
  name: "PDF Signature",
  tagline: "Sign a PDF in the browser. Draw or type your signature, place it on any page, and download the signed file.",
  description:
    "Free PDF signature tool. Draw your signature with a mouse or finger, or type your name in a script style, then drag-free position it on any page with sliders. The signature is drawn into the PDF in this browser. Nothing is uploaded.",
  category: "pdf",
  tags: ["pdf", "signature"],
  keywords: ["pdf signature", "sign pdf", "electronic signature", "draw signature"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "PenLine",
  related: ["pdf-merge", "pdf-protect-unlock", "pdf-split"],
  faqs: [
    { q: "Are my PDF and signature uploaded?", a: "No. Everything runs locally in the browser, nothing is uploaded. The PDF, your signature, and the signed output never leave this tab." },
    { q: "How do I create my signature?", a: "Draw with your mouse, trackpad, or finger on the signature pad, or type your name to render it in a script style. You can clear it and redo it as many times as you like." },
    { q: "How do I position the signature?", a: "Pick a page number, then use the X, Y, and width sliders. The preview shows exactly where the signature lands before you download." },
    { q: "Is the signature legally binding?", a: "The tool stamps your drawn or typed signature into the PDF as an image. Whether that counts as a signature depends on your country's rules and the agreement — check before relying on it." },
  ],
  seo: {
    title: "PDF Signature",
    description: "Sign a PDF in your browser. Draw or type your signature, position it on any page, and download the signed PDF. Files stay on this device.",
  },
  howTo: [
    { name: "Add the PDF", text: "Drop the PDF you want to sign. It stays in this browser." },
    { name: "Create your signature", text: "Draw it on the pad, or type your name to render it in a script style." },
    { name: "Place and download", text: "Pick a page, set X, Y, and width with the sliders, and download the signed PDF." },
  ],
  inputs: "A PDF, a drawn or typed signature, and a page with X, Y, and width placement.",
  outputs: "The original PDF with the signature stamped onto the placed pages, as a download.",
  runsLocally: true,
  badges: ["In this browser"],
} satisfies ToolMeta;
