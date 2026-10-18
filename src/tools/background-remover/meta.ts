import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "background-remover",
  name: "Background remover",
  tagline: "Cut out a portrait in the browser, or clear a solid backdrop without a download.",
  description:
    "Free background remover. A portrait uses MODNet, an Apache-2.0 matting model that downloads once and runs in this browser, with a progress line while it loads. A solid backdrop can be cleared instantly by sampling the corners. RMBG-1.4 is not used because its license is non-commercial. The picture is not uploaded.",
  category: "image",
  tags: ["image", "background"],
  keywords: ["remove background", "background remover", "remove bg"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Eraser",
  related: ["image-crop", "image-convert", "exif-viewer-remover", "image-compress"],
  faqs: [
    { q: "Is the image uploaded?", a: "No. Both the portrait model and the solid-color cutout run in this browser." },
    { q: "Which model is this?", a: "Portraits use MODNet, licensed Apache-2.0. It is trained on people, so objects and products are a weaker fit. RMBG-1.4 was skipped because that license is non-commercial. The AGPL background-removal package is not bundled." },
    { q: "What does solid color do?", a: "It samples the corners, then clears pixels of that color that touch the border. A white logo inside the subject stays. Set the color yourself when the corners are not the backdrop." },
    { q: "Why is the first portrait slow?", a: "The quantized model is about 7 MB and downloads on first use. The progress line tracks that download. Later runs reuse it." },
  ],
  seo: {
    title: "Background remover",
    description: "Remove a portrait background in the browser with MODNet, or clear a solid backdrop. The image stays on the device.",
  },
  howTo: [
    { name: "Drop the image", text: "Add a portrait or a product shot on a plain backdrop." },
    { name: "Pick portrait or solid color", text: "Portrait downloads the model and shows progress. Solid color clears the border immediately." },
    { name: "Download the PNG", text: "The result keeps transparency so you can place it on another background." },
  ],
  inputs: "An image, a portrait or solid-color mode, and an optional backdrop color.",
  outputs: "A PNG with the background removed.",
  runsLocally: true,
  badges: ["On device · MODNet · Solid color"],
} satisfies ToolMeta;
