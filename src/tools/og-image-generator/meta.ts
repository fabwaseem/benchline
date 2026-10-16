import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "og-image-generator",
  name: "OG image generator",
  tagline: "Compose a 1200×630 card, watch it update, then download the PNG or copy the Next.js file.",
  description:
    "Design a 1200×630 Open Graph image in the browser. Choose a template, set type and colors, download a PNG, or copy a Next.js opengraph-image.tsx file.",
  category: "social",
  tags: ["open-graph", "social-preview"],
  keywords: ["Open Graph", "og:image", "OG image generator", "twitter card", "1200x630"],
  status: "stable",
  createdAt: "2026-03-01",
  updatedAt: "2026-10-16",
  icon: "Image",
  related: ["meta-tags-inspector", "llms-txt-generator", "ai-seo-checker", "schema-generator"],
  faqs: [
    { q: "What size does this generator export?", a: "Every image is 1200 by 630 pixels. That is the Open Graph size Facebook, LinkedIn, Slack, Discord, and WhatsApp expect for a large link preview." },
    { q: "Is the OG image generator free?", a: "Yes. It runs in the browser. There is no account and no watermark on the PNG." },
    { q: "Are the images stored?", a: "No. The PNG is drawn on this page and downloaded to your machine. Nothing is uploaded." },
    { q: "Can I use my own logo?", a: "Yes. Drop a PNG, JPEG, WebP, or GIF. The file stays in the browser. A remote URL is drawn only when the host allows canvas access." },
    { q: "How do I use this in a Next.js app?", a: "Copy the opengraph-image.tsx file into the App Router segment that should own the preview. Next.js serves that file as the page's og:image." },
    { q: "How do I check that a platform picked up the image?", a: "Deploy the page, then paste its URL into the Facebook Sharing Debugger and the LinkedIn Post Inspector. Those caches ignore a normal reload until you ask them to scrape again." },
  ],
  seo: {
    title: "OG image generator",
    description: "Design a 1200×630 Open Graph image in the browser. Choose a template, set type and colors, download a PNG, or copy a Next.js opengraph-image.tsx file.",
  },
  howTo: [
    { name: "Pick a template", text: "Choose blog, product, minimal, gradient, code, or profile. Each starts with its own type and color." },
    { name: "Tune the card", text: "Set the title, subtitle, author, font, and colors. A logo is optional and stays on this page." },
    { name: "Download or copy", text: "Download the 1200×630 PNG or copy the Next.js file and meta tags for the template you picked." },
  ],
  inputs: "Template, title, subtitle, author, colors, font, and an optional logo file.",
  outputs: "A 1200×630 PNG, meta tags, and an opengraph-image.tsx file.",
  runsLocally: true,
  badges: ["1200 × 630 · PNG"],
} satisfies ToolMeta;
