import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "image-resize",
  name: "Image resizer",
  tagline: "Resize by pixels or percent, with the aspect ratio locked and a batch ZIP.",
  description:
    "Free image resizer. Set a width, a height, or a percent, lock the aspect ratio, and fit a batch with contain, cover, or stretch. Presets cover Instagram, Stories, Open Graph, and HD. Resizing runs in the browser, so the files stay on the device.",
  category: "image",
  tags: ["image", "resize"],
  keywords: ["resize image", "image resizer", "resize jpg", "resize png", "image size in pixels"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Scaling",
  related: ["image-compress", "image-convert", "og-image-generator", "color-converter"],
  faqs: [
    { q: "Are the images uploaded?", a: "No. The resized pixels are drawn in this browser. The file does not leave the device." },
    { q: "How does the aspect lock work?", a: "With one side filled in, each image keeps its own ratio. With both width and height filled in, every image is fitted into that same frame." },
    { q: "What is the difference between contain, cover, and stretch?", a: "Contain fits the whole image inside the frame and leaves bars. Cover fills the frame and crops the overflow. Stretch maps the image to the exact width and height." },
    { q: "Can I resize by percent?", a: "Yes. Percent scales every image by the same amount and keeps each ratio. 50 makes a 2000 pixel photo into 1000." },
    { q: "What are the presets?", a: "Instagram square is 1080×1080, portrait is 1080×1350, Story is 1080×1920, Open Graph is 1200×630, HD is 1920×1080, and the thumbnail is 320×320." },
  ],
  seo: {
    title: "Image resizer",
    description: "Resize images by pixels or percent in the browser. Lock the aspect ratio, use contain or cover, and download a batch ZIP.",
  },
  howTo: [
    { name: "Drop the images", text: "Add one picture or a batch. Each row shows the original pixel size." },
    { name: "Set pixels, a percent, or a preset", text: "Leave one side empty to keep each image's ratio. Fill both sides and pick contain, cover, or stretch for a fixed frame." },
    { name: "Download the resized files", text: "Save a single image or a ZIP. Pick JPG, PNG, WebP, or AVIF for the output." },
  ],
  inputs: "Images, a pixel width and height or a percent, an aspect lock, a fit mode, and an output format.",
  outputs: "Resized images at the computed pixel size, plus a ZIP for the batch.",
  runsLocally: true,
  badges: ["Pixels · Percent · Aspect lock"],
} satisfies ToolMeta;
