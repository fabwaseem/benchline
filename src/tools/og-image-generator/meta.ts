import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "og-image-generator",
  name: "OG image generator",
  tagline: "Pick a template, watch the card update, then download the PNG or copy the Next.js file.",
  description:
    "Design an Open Graph image in the browser. Choose from 18 templates, set the fields that template uses, download a PNG, or copy a Next.js opengraph-image.tsx file.",
  category: "social",
  tags: ["open-graph", "social-preview"],
  keywords: ["Open Graph", "og:image", "OG image generator", "twitter card", "1200x630"],
  status: "stable",
  createdAt: "2026-03-01",
  updatedAt: "2026-10-18",
  icon: "Image",
  related: ["meta-tags-inspector", "llms-txt-generator", "ai-seo-checker", "schema-generator"],
  faqs: [
    { q: "What size does this generator export?", a: "The default is 1200 by 630, the large-card size Facebook, LinkedIn, Slack, Discord, and WhatsApp expect. You can also export 1600 by 900 for X, or a 1080 square." },
    { q: "Is the OG image generator free?", a: "Yes. It runs in the browser. There is no account and no watermark on the PNG." },
    { q: "Are the images stored?", a: "No. The PNG is drawn on this page and downloaded to your machine. Nothing is uploaded." },
    { q: "Can I use my own logo?", a: "Yes. Drop a PNG, JPEG, WebP, or GIF. The file stays in the browser. A remote URL is drawn only when the host allows canvas access." },
    { q: "How do I use this in a Next.js app?", a: "Copy the opengraph-image.tsx file into the App Router segment that should own the preview. Next.js serves that file as the page's og:image." },
    { q: "How do I check that a platform picked up the image?", a: "Deploy the page, then paste its URL into the Facebook Sharing Debugger and the LinkedIn Post Inspector. Those caches ignore a normal reload until you ask them to scrape again." },
  ],
  seo: {
    title: "OG image generator",
    description: "Design an Open Graph image in the browser. Choose from 18 templates, set the fields that template uses, download a PNG, or copy a Next.js opengraph-image.tsx file.",
  },
  howTo: [
    { name: "Pick a template", text: "Search the live thumbnails or filter by Blog, Product, Dev, Social, or Event. The selected card gets an orange ring." },
    { name: "Tune the card", text: "The form shows only the fields that template uses. Set colors from the swatches or a preset, and drop a logo if the template has an image slot." },
    { name: "Download or copy", text: "Download the PNG at 1200×630, 1600×900, or 1080 square, or copy the Next.js file and meta tags." },
  ],
  inputs: "Template, the fields that template uses, colors, size, and optional images.",
  outputs: "A PNG, meta tags, and an opengraph-image.tsx file.",
  runsLocally: true,
  badges: ["1200 × 630 · 1600 × 900 · 1080"],
} satisfies ToolMeta;
