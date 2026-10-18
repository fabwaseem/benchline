import sharp from "sharp";
import { encodeBase64 } from "@/lib/base64";
import { zipNamed } from "@/lib/zip-files";
import { drawMark, type Rgb } from "@/tools/favicon-generator/lib/mark";
import { encodeIco, faviconPngs, htmlSnippet, icoSizes, manifestJson, nextMetadataSnippet, safeName } from "@/tools/favicon-generator/lib/pack";

const MAX_EDGE = 4096;

export function parseTileColor(value: string, fallback: Rgb): Rgb {
  const hex = value.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(hex)) return fallback;
  const full = hex.length === 3 ? [...hex].map((char) => char + char).join("") : hex;
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

async function masterPng(input: { bytes?: Uint8Array; text?: string; background: Rgb; color: Rgb }) {
  if (input.bytes) {
    try {
      const image = sharp(input.bytes, { failOn: "none", limitInputPixels: MAX_EDGE * MAX_EDGE, animated: false }).rotate();
      const meta = await image.metadata();
      if (!meta.width || !meta.height) throw new Error("The image has no pixels.");
      if (meta.width > MAX_EDGE || meta.height > MAX_EDGE) throw new Error("The image is larger than 4096 pixels on a side.");
      return image.resize(512, 512, { fit: "cover", position: "centre" }).png().toBuffer();
    } catch (error) {
      if (error instanceof Error && /4096|no pixels/.test(error.message)) throw error;
      throw new Error("This image could not be decoded. Use JPEG, PNG, WebP, AVIF, or GIF.");
    }
  }
  const text = [...(input.text ?? "")].slice(0, 3).join("");
  const pixels = drawMark(text || "A", input.background, input.color, 512);
  return sharp(pixels, { raw: { width: 512, height: 512, channels: 4 } }).png().toBuffer();
}

export async function buildFaviconPack(input: { bytes?: Uint8Array; text?: string; background: string; color: string; name: string }) {
  const background = parseTileColor(input.background, { r: 17, g: 17, b: 17 });
  const color = parseTileColor(input.color, { r: 255, g: 255, b: 255 });
  const master = sharp(await masterPng({ bytes: input.bytes, text: input.text, background, color }));
  const pngs = await Promise.all(faviconPngs.map(async (file) => {
    const data = new Uint8Array(await master.clone().resize(file.size, file.size).png().toBuffer());
    return { ...file, data };
  }));
  const ico = encodeIco(icoSizes.map((size) => {
    const png = pngs.find((file) => file.size === size);
    if (!png) throw new Error("Missing favicon size.");
    return { size, png: png.data };
  }));
  const manifest = manifestJson(input.name);
  const html = htmlSnippet();
  const nextMetadata = nextMetadataSnippet();
  const files = [
    { name: "favicon.ico", data: ico },
    ...pngs.map((file) => ({ name: file.name, data: file.data })),
    { name: "site.webmanifest", data: new TextEncoder().encode(manifest) },
    { name: "snippet.html", data: new TextEncoder().encode(html) },
    { name: "next-metadata.ts", data: new TextEncoder().encode(nextMetadata) },
  ];
  const zip = zipNamed(files);
  const preview = pngs.find((file) => file.size === 32)?.data ?? pngs[0]?.data;
  return {
    filename: "favicon-pack.zip",
    mime: "application/zip",
    bytes: zip.byteLength,
    data: encodeBase64(zip),
    html,
    nextMetadata,
    manifest,
    preview: preview ? encodeBase64(preview) : "",
    name: safeName(input.name),
  };
}
