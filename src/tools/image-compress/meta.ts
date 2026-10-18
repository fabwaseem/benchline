import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "image-compress",
  name: "Image compressor",
  tagline: "Shrink JPEG, PNG, WebP, and AVIF in the browser, with the real before and after size.",
  description:
    "Free image compressor. Set a quality level, optionally cap the long edge, and compress a batch of JPEG, PNG, WebP, or AVIF files. You see the size before and after, the savings, and you can download a ZIP. The work stays on this device.",
  category: "image",
  tags: ["image", "compress", "webp", "avif"],
  keywords: ["image compressor", "compress image", "compress jpeg", "webp compressor", "avif compressor"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "ImageDown",
  related: ["image-convert", "image-resize", "color-converter", "og-image-generator"],
  faqs: [
    { q: "Are the images uploaded?", a: "No. Compression runs in this browser. The original file is not sent anywhere." },
    { q: "What does the quality slider do?", a: "It sets lossy quality from 1 to 100 for JPEG, WebP, and AVIF. Lower numbers are smaller and softer. PNG is lossless, so the slider does not change a PNG unless you also cap the long edge or switch format." },
    { q: "Why did the file get larger?", a: "A high quality setting, or turning a small PNG into a heavy JPEG, can grow the file. The before and after numbers are the real byte counts, including when the result is larger." },
    { q: "Can I limit the pixel size?", a: "Yes. Max edge is the longest side in pixels. The other side follows the aspect ratio. Leave it empty to keep the original dimensions." },
    { q: "How do I download a batch?", a: "Compress, then save one file from its row or download a ZIP of every finished image." },
  ],
  seo: {
    title: "Image compressor",
    description: "Compress JPEG, PNG, WebP, and AVIF in the browser. Quality slider, before and after size, batch ZIP. Files stay on the device.",
  },
  howTo: [
    { name: "Drop a batch", text: "Add the images you want to shrink. The original size shows on each row." },
    { name: "Set quality and a max edge", text: "Quality applies to JPEG, WebP, and AVIF. Max edge is optional and keeps the aspect ratio." },
    { name: "Compare the sizes and download", text: "Each row shows the new size and the percent saved. Download one file or a ZIP." },
  ],
  inputs: "Images, a quality from 1 to 100, an optional max edge in pixels, and a target format.",
  outputs: "Compressed images with before and after byte sizes, the savings, and a ZIP for the batch.",
  runsLocally: true,
  badges: ["Quality · Before / after · ZIP"],
} satisfies ToolMeta;
