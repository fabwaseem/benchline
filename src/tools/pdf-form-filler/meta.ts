import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "pdf-form-filler",
  name: "PDF Form Filler",
  tagline: "Fill interactive PDF forms in the browser and export.",
  description:
    "Free PDF form filler that runs entirely in your browser. Drop a PDF with an interactive form, fill its text fields, checkboxes, dropdowns, and radios by name, validate required fields, and download the filled PDF — flattened or still editable. Nothing is uploaded.",
  category: "pdf",
  tags: ["pdf", "form", "fill"],
  keywords: ["fill pdf form", "pdf form filler", "fill pdf online", "pdf form fields", "flatten pdf form"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "PenLine",
  related: ["pdf-signature", "pdf-merge", "pdf-split", "pdf-compress"],
  faqs: [
    { q: "Is my PDF uploaded?", a: "No. The PDF is read into the page and filled with pdf-lib right here in the browser. It never leaves your device." },
    { q: "What field types are supported?", a: "Text fields, checkboxes, dropdowns, radio groups, and list boxes. Buttons and signature fields are listed but cannot be filled." },
    { q: "What does flattening do?", a: "Flattening bakes the filled values into the page content so the fields can no longer be edited — useful for final submissions." },
    { q: "Why is a field missing?", a: "The tool only sees real AcroForm fields. Scanned or flat PDFs have no form layer; fill those with the PDF Signature tool's overlay instead." },
  ],
  seo: {
    title: "Fill PDF Forms Online — Free PDF Form Filler",
    description: "Fill interactive PDF forms in your browser. Text, checkboxes, dropdowns, validation, flattening, and PDF download. No uploads.",
  },
  howTo: [
    { name: "Drop the PDF", text: "Add a PDF with an interactive form. Its fields are detected automatically." },
    { name: "Fill the fields", text: "Type into text fields, toggle checkboxes, and pick dropdown options. Required fields are marked." },
    { name: "Download", text: "Validate, then fill and download — flattened for final copies or editable for drafts." },
  ],
  inputs: "A PDF with an AcroForm, values per field, and a flatten switch.",
  outputs: "A filled PDF download, plus a validation report.",
  runsLocally: true,
  badges: ["In this browser"],
} satisfies ToolMeta;
