import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "meme-generator",
  name: "Meme Generator",
  tagline: "Classic top/bottom caption memes from styles or your own images.",
  description:
    "Free meme maker that runs entirely in your browser. Pick a gradient style or upload an image, add top and bottom captions in the classic outlined style, drag them into place, and download a PNG. Nothing is uploaded.",
  category: "social",
  tags: ["meme", "image", "captions"],
  keywords: ["meme generator", "meme maker", "caption image", "make a meme", "meme text generator"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Sparkles",
  related: ["og-image-generator", "image-resize", "social-image-resizer", "image-compress"],
  faqs: [
    { q: "Are my images uploaded anywhere?", a: "No. The image is read into the page and the meme is drawn on a canvas in this browser. It never leaves your device until you download it." },
    { q: "How do I move the captions?", a: "Drag a caption directly on the preview to nudge it up or down. Each caption stays inside the image." },
    { q: "What size is the download?", a: "900 pixels wide as a PNG. Style backgrounds are square; uploaded images keep their own aspect ratio." },
    { q: "Can I use my own meme templates?", a: "Yes — switch to the Upload tab and drop any image. It becomes the meme background." },
  ],
  seo: {
    title: "Meme Generator — Make Memes Online, Free",
    description: "Create classic caption memes in your browser. Add top and bottom text to gradient styles or your own images, drag captions into place, download PNG.",
  },
  howTo: [
    { name: "Pick a background", text: "Choose one of the gradient styles, or switch to Upload and drop your own image." },
    { name: "Write the captions", text: "Type the top and bottom text. ALL CAPS is on by default for the classic look; adjust the size slider." },
    { name: "Position and download", text: "Drag captions on the preview to nudge them, then download the PNG or copy it with Ctrl/⌘+C." },
  ],
  inputs: "Top and bottom captions, a style or an uploaded image, text size, and caption positions.",
  outputs: "A 900px-wide PNG meme, downloadable or copyable.",
  runsLocally: true,
  badges: ["In this browser"],
} satisfies ToolMeta;
