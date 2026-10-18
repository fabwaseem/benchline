import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "social-image-resizer",
  name: "Social Image Resizer",
  tagline: "Fit any photo to the exact dimensions for Instagram, YouTube, X, LinkedIn, and Facebook — cropped to the subject you pick.",
  description:
    "Free social image resizer. Upload a photo, pick a platform preset such as Instagram post 1080×1080 or YouTube thumbnail 1280×720, click to set the crop focal point, and export an exact-size PNG or JPEG. Everything runs in the browser; the image is never uploaded.",
  category: "social",
  tags: ["image", "social"],
  keywords: ["social image resizer", "instagram image size", "youtube thumbnail size", "resize image for instagram", "facebook post image size", "x header size"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Share2",
  related: ["image-resize", "image-compress", "og-image-generator"],
  faqs: [
    { q: "Is my photo uploaded anywhere?", a: "No. The photo is decoded and resized in this browser. Everything runs locally in the browser, and nothing is uploaded." },
    { q: "What sizes can I export?", a: "Instagram post 1080×1080, portrait 1080×1350, and story 1080×1920; YouTube thumbnail 1280×720; X post 1200×675 and header 1500×500; LinkedIn post 1200×627; and Facebook post 1200×630." },
    { q: "What does the focal point do?", a: "It pins the subject of the crop. Click the face or object you want to keep, and the cover crop slides to keep it visible instead of cropping it away." },
    { q: "PNG or JPEG?", a: "PNG keeps full quality for graphics and text. JPEG is smaller for photos and lets you set the quality with a slider." },
  ],
  seo: {
    title: "Social Image Resizer",
    description: "Resize images to exact Instagram, YouTube, X, LinkedIn, and Facebook dimensions in your browser. Click to set the crop focus. Nothing is uploaded.",
  },
  howTo: [
    { name: "Drop a photo", text: "Add one image. It stays in this browser." },
    { name: "Pick a platform preset", text: "Choose Instagram post, YouTube thumbnail, X header, and more. Click the preview to set the crop focal point on your subject." },
    { name: "Export the exact size", text: "Download a PNG or JPEG at the platform's exact pixel dimensions." },
  ],
  inputs: "An image, a social platform preset, a crop focal point, and a PNG or JPEG output format.",
  outputs: "One image at the preset's exact width and height, as PNG or JPEG.",
  runsLocally: true,
  badges: ["In this browser"],
} satisfies ToolMeta;
