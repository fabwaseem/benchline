export const faviconPngs = [
  { name: "favicon-16x16.png", size: 16 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "favicon-48x48.png", size: 48 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "android-chrome-192x192.png", size: 192 },
  { name: "android-chrome-512x512.png", size: 512 },
] as const;

export const icoSizes = [16, 32, 48] as const;

export function safeName(value: string) {
  const cleaned = value.replace(/[\u0000-\u001f"<>]/g, "").trim().slice(0, 40);
  return cleaned || "App";
}

export function manifestJson(name: string) {
  return `${JSON.stringify({
    name: safeName(name),
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  }, null, 2)}\n`;
}

export function htmlSnippet() {
  return [
    '<link rel="icon" href="/favicon.ico" sizes="any">',
    '<link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32">',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
    '<link rel="manifest" href="/site.webmanifest">',
    "",
  ].join("\n");
}

export function nextMetadataSnippet() {
  return [
    "export const metadata = {",
    "  icons: {",
    "    icon: [",
    "      { url: \"/favicon.ico\" },",
    "      { url: \"/favicon-32x32.png\", sizes: \"32x32\", type: \"image/png\" },",
    "    ],",
    "    apple: \"/apple-touch-icon.png\",",
    "  },",
    "  manifest: \"/site.webmanifest\",",
    "};",
    "",
  ].join("\n");
}

export function encodeIco(images: readonly { size: number; png: Uint8Array }[]) {
  if (images.length === 0 || images.length > 16) throw new Error("An ICO needs between 1 and 16 images.");
  const header = 6;
  const directory = images.length * 16;
  let offset = header + directory;
  const entries = images.map((image) => {
    if (image.size < 1 || image.size > 256) throw new Error("ICO images must be 256 pixels or smaller.");
    const entry = new Uint8Array(16);
    const view = new DataView(entry.buffer);
    entry[0] = image.size === 256 ? 0 : image.size;
    entry[1] = image.size === 256 ? 0 : image.size;
    view.setUint16(4, 1, true);
    view.setUint16(6, 32, true);
    view.setUint32(8, image.png.byteLength, true);
    view.setUint32(12, offset, true);
    offset += image.png.byteLength;
    return entry;
  });
  const bytes = new Uint8Array(offset);
  const view = new DataView(bytes.buffer);
  view.setUint16(2, 1, true);
  view.setUint16(4, images.length, true);
  let cursor = header;
  for (const entry of entries) {
    bytes.set(entry, cursor);
    cursor += entry.byteLength;
  }
  for (const image of images) {
    bytes.set(image.png, cursor);
    cursor += image.png.byteLength;
  }
  return bytes;
}
