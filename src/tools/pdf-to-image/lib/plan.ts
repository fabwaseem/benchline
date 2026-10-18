import { zipSync } from "fflate";

export const imageFormats = ["png", "jpeg"] as const;
export type ImageFormat = (typeof imageFormats)[number];

export const MAX_RENDER_PAGES = 24;
export const MAX_RENDER_BYTES = 25 * 1024 * 1024;

export type RenderedImage = {
  name: string;
  bytes: Uint8Array;
  width: number;
  height: number;
};

export function scaleForDpi(dpi: number) {
  if (!Number.isInteger(dpi) || dpi < 72 || dpi > 216) throw new Error("DPI is a whole number from 72 to 216.");
  return dpi / 72;
}

export function assertQuality(quality: number) {
  if (!Number.isInteger(quality) || quality < 1 || quality > 100) throw new Error("Quality is a whole number from 1 to 100.");
  return quality;
}

export function safeStem(name: string) {
  const stem = name.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "-").replace(/^[-.]+|[-.]+$/g, "");
  return stem.slice(0, 40) || "page";
}

export function imageName(stem: string, page: number, format: ImageFormat) {
  return `${safeStem(stem)}-${page}.${format === "jpeg" ? "jpg" : "png"}`;
}

export function packImages(images: RenderedImage[]) {
  let total = 0;
  for (const image of images) {
    total += image.bytes.byteLength;
    if (total > MAX_RENDER_BYTES) throw new Error("Those pages are larger than 25 MB together. Lower the DPI or pick fewer pages.");
  }
  if (images.length <= 1) return null;
  const files: Record<string, Uint8Array> = {};
  for (const image of images) files[image.name] = image.bytes;
  return zipSync(files, { level: 6 });
}
