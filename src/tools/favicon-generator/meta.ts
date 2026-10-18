import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "favicon-generator",
  name: "Favicon generator",
  tagline: "Make the ICO, the PNG sizes, the manifest, and the HTML snippet from a picture or letters.",
  description:
    "Free favicon generator. Start from an image or up to three letters, then download a ZIP with favicon.ico, the PNG sizes, a web manifest, an HTML snippet, and a Next.js metadata snippet. The pack is built in this browser.",
  category: "design",
  tags: ["favicon", "ico", "pwa"],
  keywords: ["favicon generator", "favicon ico", "apple touch icon"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "AppWindow",
  related: ["image-resize", "og-image-generator", "color-converter", "svg-optimizer"],
  faqs: [
    { q: "What is in the ZIP?", a: "favicon.ico, PNGs at 16, 32, 48, 180, 192, and 512, site.webmanifest, an HTML snippet, and a Next.js metadata snippet." },
    { q: "Can I start from letters?", a: "Yes. Type up to three letters. They are drawn on a colored tile. An uploaded image is cropped to a square cover." },
    { q: "Does the image get uploaded?", a: "No. The sizes are drawn in this browser." },
  ],
  seo: {
    title: "Favicon generator",
    description: "Generate favicon.ico, PNG sizes, a web manifest, and the HTML snippet from an image or letters.",
  },
  howTo: [
    { name: "Add an image or letters", text: "Drop a picture, or type a short mark and pick the colors." },
    { name: "Name the app", text: "The name is written into the web manifest." },
    { name: "Download the pack", text: "The ZIP includes the icons and the tags to paste into the page." },
  ],
  inputs: "An image or up to three letters, two colors, and an app name.",
  outputs: "A ZIP of icon files, plus the HTML and Next.js metadata snippets.",
  runsLocally: true,
  badges: ["ICO · Manifest · Next.js"],
} satisfies ToolMeta;
