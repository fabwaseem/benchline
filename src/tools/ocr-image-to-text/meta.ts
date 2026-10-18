import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "ocr-image-to-text",
  name: "Image to text",
  tagline: "Read the words in a picture. The OCR model downloads once and runs in this browser.",
  description:
    "Free image to text. Tesseract reads the picture in this browser after a one-time download of the language data. Pick a language, then copy or download the text. A progress line shows the download and the recognition.",
  category: "image",
  tags: ["ocr", "text"],
  keywords: ["image to text", "ocr online", "extract text from image"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "ScanText",
  related: ["image-convert", "qr-code-reader", "image-to-pdf", "pdf-merge"],
  faqs: [
    { q: "Is the image uploaded?", a: "No. Recognition runs in this browser. The first run downloads the language data, which is cached after that." },
    { q: "Which languages are available?", a: "English is the default. Spanish, French, German, Portuguese, Italian, Dutch, Polish, Turkish, Russian, Arabic, Hindi, simplified Chinese, Japanese, and Korean are in the list." },
    { q: "Why is the first run slow?", a: "The OCR engine and the language file download on first use. Later runs in the same browser reuse that download." },
  ],
  seo: {
    title: "Image to text (OCR)",
    description: "Extract text from an image in the browser. Pick a language and copy the result. The picture is not uploaded.",
  },
  howTo: [
    { name: "Drop the image", text: "Add a screenshot, a scan, or a photo of text." },
    { name: "Choose the language", text: "English is ready first. Other languages download when you pick them." },
    { name: "Copy the text", text: "The page shows progress, then the text and a confidence score." },
  ],
  inputs: "An image and a language.",
  outputs: "The recognized text and a confidence score.",
  runsLocally: true,
  badges: ["Local OCR · Languages"],
} satisfies ToolMeta;
