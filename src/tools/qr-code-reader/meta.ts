import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "qr-code-reader",
  name: "QR and barcode reader",
  tagline: "Read QR codes and barcodes from a photo, a paste, or the camera.",
  description:
    "Free QR and barcode reader. Drop an image, paste one, or scan with the camera. Several codes in one picture are listed with their format. Decoding runs in this browser, so the photo stays on the device.",
  category: "image",
  tags: ["qr", "barcode"],
  keywords: ["qr code scanner online", "scan qr code from image", "barcode reader"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "ScanBarcode",
  related: ["qr-code-generator", "image-convert", "ocr-image-to-text", "image-crop"],
  faqs: [
    { q: "Does the photo get uploaded?", a: "No. The decoder runs in this browser. A picture you drop or paste is not sent to a server." },
    { q: "Which codes are recognized?", a: "QR, Aztec, Data Matrix, PDF417, and common retail barcodes such as EAN, UPC, and Code 128." },
    { q: "Can it read more than one code?", a: "Yes. Up to eight codes in the same image are listed, each with its text and format." },
    { q: "Can I use the camera?", a: "Yes. Start the camera and hold the code in frame. The page asks for camera access and keeps the frames on the device." },
  ],
  seo: {
    title: "QR and barcode reader",
    description: "Read QR codes and barcodes from an image or the camera. The photo stays in the browser.",
  },
  howTo: [
    { name: "Add a picture", text: "Drop an image, paste one, or start the camera." },
    { name: "Read the codes", text: "Each code is listed with its format. Copy the text you need." },
  ],
  inputs: "An image, a pasted picture, or a camera frame.",
  outputs: "The text and format of each code found in the image.",
  runsLocally: true,
  badges: ["QR · Barcode · Camera"],
} satisfies ToolMeta;
