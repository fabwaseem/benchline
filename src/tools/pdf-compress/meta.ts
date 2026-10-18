import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "pdf-compress",
  name: "Compress PDF",
  tagline: "Shrink a PDF in the browser. Pick a preset or a target size and compare the file before and after.",
  description:
    "Free PDF compressor. Shrink a PDF for an upload limit without sending it anywhere. Light, medium, and strong presets recompress embedded images and clear document info. Text stays selectable. A target of 100 KB, 200 KB, or 500 KB tries harder until the file fits or the smallest result is reached.",
  category: "pdf",
  tags: ["pdf", "compress"],
  keywords: ["pdf compressor", "compress pdf", "online pdf compressor"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Shrink",
  related: ["pdf-merge", "pdf-split", "image-to-pdf", "qr-code-generator"],
  faqs: [
    { q: "Is the PDF uploaded?", a: "No. Compression runs in this browser. The file does not leave the device." },
    { q: "Will the text still be selectable?", a: "Yes. The tool recompresses embedded images and leaves the text drawing commands in place. It does not redraw the pages as pictures." },
    { q: "Why did the file barely change?", a: "A PDF that is already small, or that has no embedded images, has little to recompress. If a pass would make the file larger, the original is kept." },
    { q: "What do the presets change?", a: "Light uses high JPEG quality. Medium uses lower quality. Strong also downsamples images. A target size keeps trying stronger settings until the file is under that size or the ladder ends." },
    { q: "What about passwords and scanned pages?", a: "Encrypted PDFs are refused. Scanned pages stored as images shrink the most. Images inside other formats, such as JPEG 2000, are left as they are." },
  ],
  seo: {
    title: "Compress PDF",
    description: "Compress a PDF in your browser. Choose light, medium, or strong, or aim for 100 KB, 200 KB, or 500 KB. Files stay on this device.",
  },
  howTo: [
    { name: "Add a PDF", text: "Drop one PDF. It stays in this browser." },
    { name: "Pick a preset and an optional target", text: "Light, medium, or strong. Add a 100 KB, 200 KB, or 500 KB target when you need to fit a limit." },
    { name: "Compare and download", text: "The result shows the size before and after. Download the smaller file." },
  ],
  inputs: "One PDF, a light, medium, or strong preset, and an optional target size.",
  outputs: "A PDF, plus the size before, the size after, and how many images were recompressed.",
  runsLocally: true,
  badges: ["Light · Medium · Strong"],
} satisfies ToolMeta;
