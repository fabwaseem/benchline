import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "image-crop",
  name: "Image cropper",
  tagline: "Crop with a free box or an aspect preset, including a circle.",
  description:
    "Free image cropper. Drag the frame, lock an aspect such as 1:1, 4:5, 16:9, or Open Graph, and export JPG, PNG, or WebP. A circle crop keeps a round mask. Cropping runs in this browser.",
  category: "image",
  tags: ["image", "crop"],
  keywords: ["crop image", "crop photo online", "circle crop"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Crop",
  related: ["image-resize", "image-convert", "favicon-generator", "og-image-generator"],
  faqs: [
    { q: "Is the image uploaded?", a: "No. The crop is drawn in this browser." },
    { q: "What does the circle crop do?", a: "It masks the crop to a circle. PNG and WebP keep the transparent corners. JPG flattens those corners to white." },
    { q: "Which aspect presets are there?", a: "Free, square, 4:5, 3:2, 16:9, 9:16, and Open Graph at 1200×630." },
  ],
  seo: {
    title: "Image cropper",
    description: "Crop an image with aspect presets or a circle, then download JPG, PNG, or WebP. The file stays in the browser.",
  },
  howTo: [
    { name: "Drop an image", text: "The frame opens on the picture." },
    { name: "Set the frame", text: "Drag, zoom, and pick an aspect or a circle." },
    { name: "Download the crop", text: "Choose JPG, PNG, or WebP." },
  ],
  inputs: "An image, a crop frame, an aspect preset, a circle toggle, and an output format.",
  outputs: "The cropped image.",
  runsLocally: true,
  badges: ["Aspect · Circle · JPG PNG WebP"],
} satisfies ToolMeta;
