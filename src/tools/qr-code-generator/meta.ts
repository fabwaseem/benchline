import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "qr-code-generator",
  name: "QR code generator",
  tagline: "Make a static QR code for text, a URL, Wi-Fi, or a vCard. Set the colors and error correction, then download SVG or PNG.",
  description:
    "Free QR code generator for a URL, plain text, a Wi-Fi network, or a vCard. Pick the colors and the error-correction level, then download SVG and PNG. The code is static: it does not track scans, and it is drawn in this browser.",
  category: "design",
  tags: ["qr", "barcode"],
  keywords: ["qr code generator", "free qr code generator", "wifi qr code"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "QrCode",
  related: ["image-to-pdf", "og-image-generator", "schema-generator", "pdf-merge"],
  faqs: [
    { q: "Is this a dynamic QR code?", a: "No. The code stores the text itself. It does not redirect through a tracking server, and it does not expire when a subscription ends." },
    { q: "What is the error-correction level?", a: "L recovers about 7% of a damaged code, M about 15%, Q about 25%, and H about 30%. A higher level makes a denser code and holds less text." },
    { q: "How do I share Wi-Fi?", a: "Choose Wi-Fi, enter the network name, the password, and WPA, WEP, or no password. A phone can join from the code. The password is inside the image, so share the file only with people who should have it." },
    { q: "Which file should I download?", a: "SVG stays sharp at any size and is the better print file. PNG is a bitmap at the pixel size you pick, useful where SVG is not accepted." },
    { q: "Does the code leave this browser?", a: "No. The SVG and PNG are generated here from the text you type." },
  ],
  seo: {
    title: "QR code generator",
    description: "Free QR code generator for a URL, text, Wi-Fi, or vCard. Set colors and error correction, then download SVG or PNG. Static, in the browser.",
  },
  howTo: [
    { name: "Choose what the code stores", text: "Text, a URL, Wi-Fi, or a vCard. Fill the fields for that type." },
    { name: "Set colors and error correction", text: "Pick two different colors. L, M, Q, and H trade density for damage recovery." },
    { name: "Download SVG or PNG", text: "SVG is sharp at any size. PNG uses the pixel size you selected." },
  ],
  inputs: "Text, a URL, Wi-Fi details, or a vCard, plus colors, error correction, quiet zone, and pixel size.",
  outputs: "An SVG file and a PNG file of the same static QR code.",
  runsLocally: true,
  badges: ["SVG · PNG"],
} satisfies ToolMeta;
