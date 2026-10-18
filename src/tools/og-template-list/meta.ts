import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "og-template-list",
  name: "OG template list",
  tagline: "Browse Open Graph template ids, fields, and color presets.",
  description:
    "List every Open Graph card template, with its id, category, fields, and color presets. Copy an id into the OG image generator or pass it to list_og_templates.",
  category: "social",
  tags: ["open-graph", "social-preview"],
  keywords: ["Open Graph templates", "og template list", "list_og_templates"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Images",
  related: ["og-image-generator", "meta-tags-inspector", "social-image-resizer", "schema-generator"],
  faqs: [
    { q: "What is a template id for?", a: "The OG image generator and the list_og_templates MCP tool both take that id. This page is the index of ids." },
    { q: "Does this draw the card?", a: "No. It lists the templates. The OG image generator draws the PNG." },
    { q: "Do the presets leave this browser?", a: "No. The list is bundled with the page. Nothing is uploaded." },
  ],
  seo: {
    title: "Open Graph template list",
    description: "Browse Open Graph template ids, the fields each template uses, and its color presets.",
  },
  howTo: [
    { name: "Filter by category", text: "Choose Blog, Product, Dev, Social, or Event, or leave the list on every template." },
    { name: "Read the fields", text: "Each row shows the id and the fields that template uses." },
    { name: "Copy the id", text: "Copy the id and paste it into the OG image generator." },
  ],
  inputs: "An optional template category.",
  outputs: "Template ids, names, fields, and color presets.",
  runsLocally: true,
} satisfies ToolMeta;
