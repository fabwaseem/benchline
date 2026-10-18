import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "svg-optimizer",
  name: "SVG optimizer",
  tagline: "Minify an SVG, compare the size, and keep the viewBox unless you turn that off.",
  description:
    "Free SVG optimizer. SVGO runs in this browser: comments, metadata, and extra precision come out, and you can turn each pass off. The viewBox stays unless you remove it. The file is not uploaded.",
  category: "image",
  tags: ["svg", "optimize"],
  keywords: ["svg optimizer", "svgo online", "minify svg"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "FileCode",
  related: ["image-compress", "favicon-generator", "color-converter", "image-convert"],
  faqs: [
    { q: "Is the SVG uploaded?", a: "No. SVGO runs in this browser." },
    { q: "Will the viewBox be removed?", a: "Not unless you turn that on. Removing the viewBox can change how the SVG scales." },
    { q: "What does precision do?", a: "It sets how many decimal places path and transform numbers keep. Lower numbers are smaller and less exact." },
    { q: "Are scripts removed?", a: "Yes. Script elements are always removed." },
  ],
  seo: {
    title: "SVG optimizer",
    description: "Minify SVG files in the browser with plugin toggles, precision, and a before-and-after size.",
  },
  howTo: [
    { name: "Paste or drop the SVG", text: "Add the markup. The original size is counted in bytes." },
    { name: "Choose the passes", text: "Leave the viewBox on. Turn off a pass if it changes something you need." },
    { name: "Copy or download", text: "Save the smaller file and check the preview." },
  ],
  inputs: "SVG markup, a decimal precision, and optional passes such as removing the viewBox.",
  outputs: "Minified SVG markup and the size before and after.",
  runsLocally: true,
  badges: ["SVGO · Preview · Size"],
} satisfies ToolMeta;
