import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "exif-viewer-remover",
  name: "EXIF viewer and remover",
  tagline: "Read photo metadata, including GPS, and strip all of it or only the location.",
  description:
    "Free EXIF viewer and metadata remover. See the camera, the time, and the GPS coordinates, then download a copy with every tag removed or with only the GPS block taken out of a JPEG. Reading and stripping run in this browser.",
  category: "image",
  tags: ["exif", "privacy", "metadata"],
  keywords: ["exif viewer", "remove metadata from photo", "remove gps from photo"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Aperture",
  related: ["image-compress", "image-convert", "background-remover", "image-crop"],
  faqs: [
    { q: "Are the photos uploaded?", a: "No. Metadata is read in this browser, and the cleaned file is built here too." },
    { q: "What is the difference between stripping GPS and stripping everything?", a: "GPS-only works on JPEG and leaves the other tags. Stripping everything re-encodes the picture, which drops GPS, camera, and time together." },
    { q: "Does this work on PNG and WebP?", a: "Yes for reading, when those files carry metadata. Cleaning them re-encodes the pixels, so every tag goes, not only GPS." },
    { q: "Can I clean a batch?", a: "Yes. Add several photos, then strip each one or download them as you go." },
  ],
  seo: {
    title: "EXIF viewer and metadata remover",
    description: "Read photo metadata and GPS, then strip the location or every tag. The file stays in the browser.",
  },
  howTo: [
    { name: "Drop the photos", text: "Each file is read locally. GPS, camera, and time show up when they are present." },
    { name: "Strip GPS or everything", text: "GPS-only keeps the other JPEG tags. Strip all re-encodes the picture." },
    { name: "Download the cleaned file", text: "Save the copy before you share it." },
  ],
  inputs: "One or more photos, and a choice to read, strip GPS, or strip every tag.",
  outputs: "A tag list, a GPS reading when one exists, and a cleaned image.",
  runsLocally: true,
  badges: ["GPS · Privacy · Batch"],
} satisfies ToolMeta;
