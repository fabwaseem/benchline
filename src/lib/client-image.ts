import { isHeic, mimeFor, type OutputFormat } from "@/lib/image-format";
import type { Placement } from "@/tools/image-resize/lib/resize";

const MAX_PIXELS = 40_000_000;

const support = new Map<OutputFormat, Promise<boolean>>();

export function fullFrame(width: number, height: number): Placement {
  return { sx: 0, sy: 0, sw: width, sh: height, dx: 0, dy: 0, dw: width, dh: height };
}

export async function encoderSupports(format: OutputFormat): Promise<boolean> {
  const cached = support.get(format);
  if (cached) return cached;
  const pending = probe(format);
  support.set(format, pending);
  return pending;
}

async function probe(format: OutputFormat): Promise<boolean> {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mimeFor(format), 0.8));
  return Boolean(blob && (blob.type === "" || blob.type === mimeFor(format)));
}

/**
 * HEIC and HEIF are decoded by the browser's own codec.
 * A bundled decoder would pull in libheif, which is LGPL, so unsupported browsers get a clear error instead.
 */
export async function fileToBitmap(file: File): Promise<ImageBitmap> {
  if (isHeic(file.name, file.type)) return decodeHeic(file);
  try {
    return await createImageBitmap(file);
  } catch {
    return decodeElement(file);
  }
}

async function decodeHeic(file: File): Promise<ImageBitmap> {
  const type = file.type || "image/heic";
  if (typeof ImageDecoder !== "undefined") {
    try {
      const decoder = new ImageDecoder({ data: await file.arrayBuffer(), type });
      const { image } = await decoder.decode();
      const bitmap = await createImageBitmap(image);
      image.close();
      decoder.close();
      return bitmap;
    } catch {
      // Fall through to the platform decoder.
    }
  }
  try {
    return await createImageBitmap(file);
  } catch {
    throw new Error("This browser cannot decode HEIC on this device. Export a JPEG from Photos, or open this page in Safari.");
  }
}

function decodeElement(file: File): Promise<ImageBitmap> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      createImageBitmap(image).then(resolve, () => reject(new Error("This file could not be decoded in the browser.")));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This file could not be decoded in the browser."));
    };
    image.src = url;
  });
}

export async function renderToBlob(options: {
  bitmap: ImageBitmap;
  width: number;
  height: number;
  frame?: Placement;
  format: OutputFormat;
  quality: number;
}): Promise<Blob> {
  if (options.bitmap.width * options.bitmap.height > MAX_PIXELS) {
    throw new Error("This image is over 40 megapixels. Export a smaller copy first.");
  }
  const width = Math.max(1, Math.round(options.width));
  const height = Math.max(1, Math.round(options.height));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot draw images.");
  const frame = options.frame ?? fullFrame(options.bitmap.width, options.bitmap.height);
  if (options.format === "jpeg") {
    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(options.bitmap, frame.sx, frame.sy, frame.sw, frame.sh, frame.dx, frame.dy, frame.dw, frame.dh);
  const mime = mimeFor(options.format);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mime, options.format === "png" ? undefined : options.quality);
  });
  if (!blob || (blob.type !== "" && blob.type !== mime)) {
    throw new Error(`This browser cannot encode ${options.format === "jpeg" ? "JPEG" : options.format.toUpperCase()}.`);
  }
  return blob;
}
