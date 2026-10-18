import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "photo-collage",
  name: "Photo Collage",
  tagline: "Arrange photos into grid layouts and export high-res PNGs.",
  description:
    "Free photo collage maker that runs entirely in your browser. Pick from 7 layouts, drop up to 9 photos, pan and zoom each cell, tune the gap and background, and download a 2400px PNG. Nothing is uploaded.",
  category: "image",
  tags: ["collage", "photos", "grid"],
  keywords: ["photo collage maker", "picture collage", "collage grid", "combine photos", "photo grid maker"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Images",
  related: ["image-resize", "image-compress", "meme-generator", "social-image-resizer"],
  faqs: [
    { q: "Are my photos uploaded?", a: "No. Photos are read into the page and composited on a canvas in this browser. They never leave your device." },
    { q: "How do I position a photo inside its cell?", a: "Click the cell to select it, then drag the photo to pan and use the zoom slider. Photos always cover their cell." },
    { q: "What resolution is the download?", a: "2400 pixels on the long side, as a PNG — sharp enough for printing small formats and crisp on screens." },
    { q: "How many photos can I use?", a: "Up to 9, depending on the layout. Layouts range from 2 to 9 cells." },
  ],
  seo: {
    title: "Photo Collage Maker — Combine Photos Online, Free",
    description: "Make a photo collage in your browser. 7 grid layouts, drag-to-pan cells, zoom, gap and background controls, 2400px PNG export.",
  },
  howTo: [
    { name: "Pick a layout", text: "Choose from duo, trio, focus, quad, six, or nine-cell grids, plus the aspect ratio." },
    { name: "Add photos", text: "Drop up to 9 photos, then auto-fill the cells or click an empty cell to place a specific photo." },
    { name: "Arrange and export", text: "Drag photos to pan, zoom the selected cell, tune gap and background, then download the PNG." },
  ],
  inputs: "Up to 9 photos, a layout, aspect ratio, gap, background color, and per-cell zoom/pan.",
  outputs: "A 2400px-wide PNG collage.",
  runsLocally: true,
  badges: ["In this browser"],
} satisfies ToolMeta;
