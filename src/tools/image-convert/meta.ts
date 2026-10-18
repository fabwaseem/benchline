import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "image-convert",
  name: "Image format converter",
  tagline: "Convert HEIC, WebP, PNG, JPG, and AVIF in the browser. Nothing is uploaded.",
  description:
    "Free image format converter for HEIC to JPG, WebP to PNG, PNG to JPG, and AVIF. Drop a batch, pick a target, and download the files or a ZIP. Decoding and encoding run on this device, so the pictures never leave the browser.",
  category: "image",
  tags: ["image", "convert", "heic", "webp"],
  keywords: ["heic to jpg", "webp to png", "png to jpg", "avif converter", "image format converter"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Images",
  related: ["image-compress", "image-resize", "color-converter", "og-image-generator"],
  faqs: [
    { q: "Are the images uploaded?", a: "No. The file is decoded and re-encoded in this browser. Closing the tab drops it. The page does not send the bytes to a server." },
    { q: "Why does HEIC fail in some browsers?", a: "HEIC uses the decoder built into the operating system. Safari on Apple devices can read it. Many Windows and Linux browsers cannot. This tool does not bundle a HEIC decoder, because the usual library is LGPL. Export a JPEG from Photos if the page refuses the file." },
    { q: "Which formats can I convert?", a: "Output is JPEG, PNG, WebP, or AVIF, when this browser can encode that type. Input is JPEG, PNG, WebP, AVIF, GIF, and HEIC when the browser can decode them. A GIF keeps its first frame." },
    { q: "Is EXIF or GPS kept?", a: "No. Drawing the picture onto a canvas drops camera metadata, including location. That is useful before you publish a photo." },
    { q: "Can I convert more than one file?", a: "Yes. Drop a batch, pick one target format, then save each file or download a ZIP. Up to 40 images at a time." },
  ],
  seo: {
    title: "HEIC to JPG converter",
    description: "Convert HEIC, WebP, PNG, JPG, and AVIF in the browser. Batch convert and download a ZIP. Files stay on the device.",
  },
  howTo: [
    { name: "Drop the images", text: "Add one photo or a batch. HEIC, JPEG, PNG, WebP, AVIF, and GIF are accepted when the browser can read them." },
    { name: "Pick JPG, PNG, WebP, or AVIF", text: "One target applies to the whole batch. A link with ?to=jpeg opens the page already set to JPG." },
    { name: "Save a file or the ZIP", text: "Each row shows the new size. Download one image or a ZIP of the finished files." },
  ],
  inputs: "One or more images and a target format: JPEG, PNG, WebP, or AVIF.",
  outputs: "Converted images, each with its new byte size, plus a ZIP for the batch.",
  runsLocally: true,
  badges: ["HEIC · WebP · PNG · JPG · AVIF"],
} satisfies ToolMeta;
