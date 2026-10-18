import sharp from "sharp";

type Sharp = ReturnType<typeof sharp>;
import { encodeBase64 } from "@/lib/base64";
import { MCP_MAX_BYTES } from "@/lib/mcp/bytes";
import {
  clampQuality,
  extensionFor,
  mimeFor,
  outputFilename,
  resolveOutput,
  savings,
  sniffFormat,
  type OutputFormat,
} from "@/lib/image-format";
import { compressionPlan, type CompressChoice } from "@/tools/image-compress/lib/compress";
import { conversionPlan } from "@/tools/image-convert/lib/convert";
import { placement, planResize, type FitMode, type ResizeMode } from "@/tools/image-resize/lib/resize";

const MAX_EDGE = 8192;
const MAX_PIXELS = MAX_EDGE * MAX_EDGE;

sharp.cache(false);

export type EncodedImage = {
  filename: string;
  mime: string;
  extension: string;
  width: number;
  height: number;
  bytes: number;
  data: string;
};

type Raster = { width: number; height: number };

function asError(error: unknown, fallback: string) {
  if (error instanceof Error && /larger than 10 MB|no pixels|8192 pixels/.test(error.message)) return error;
  return new Error(fallback);
}

async function openImage(bytes: Uint8Array): Promise<{ image: Sharp; size: Raster }> {
  try {
    const image = sharp(bytes, { failOn: "none", limitInputPixels: MAX_PIXELS, animated: false }).rotate();
    const meta = await image.metadata();
    const storedWidth = meta.width ?? 0;
    const storedHeight = meta.height ?? 0;
    if (storedWidth < 1 || storedHeight < 1) throw new Error("The image has no pixels.");
    const swap = (meta.orientation ?? 1) >= 5;
    const width = swap ? storedHeight : storedWidth;
    const height = swap ? storedWidth : storedHeight;
    if (width > MAX_EDGE || height > MAX_EDGE) throw new Error("The image is larger than 8192 pixels on a side.");
    return { image, size: { width, height } };
  } catch (error) {
    throw asError(error, "This image could not be decoded. Use JPEG, PNG, WebP, AVIF, or GIF.");
  }
}

async function encode(image: Sharp, format: OutputFormat, quality: number) {
  const pipeline =
    format === "jpeg"
      ? image.jpeg({ quality, mozjpeg: true })
      : format === "png"
        ? image.png()
        : format === "webp"
          ? image.webp({ quality })
          : image.avif({ quality });
  try {
    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
    if (data.byteLength > MCP_MAX_BYTES) throw new Error("The result is larger than 10 MB.");
    return { bytes: new Uint8Array(data), width: info.width, height: info.height };
  } catch (error) {
    throw asError(error, "This image could not be encoded.");
  }
}

function packed(filename: string, format: OutputFormat, encoded: { bytes: Uint8Array; width: number; height: number }): EncodedImage {
  return {
    filename: outputFilename(filename, format),
    mime: mimeFor(format),
    extension: extensionFor(format),
    width: encoded.width,
    height: encoded.height,
    bytes: encoded.bytes.byteLength,
    data: encodeBase64(encoded.bytes),
  };
}

export async function asPdfImage(bytes: Uint8Array, filename: string, mime: string): Promise<{ data: Uint8Array; kind: "jpg" | "png" }> {
  if (sniffFormat(filename, mime) === "heic") throw new Error("HEIC is not decoded on the server. Convert it to JPEG or PNG first.");
  if (isJpeg(bytes)) return { data: bytes, kind: "jpg" };
  if (isPng(bytes)) return { data: bytes, kind: "png" };
  const { image } = await openImage(bytes);
  const encoded = await encode(image, "png", 90);
  return { data: encoded.bytes, kind: "png" };
}

function isJpeg(bytes: Uint8Array) {
  return bytes.length > 2 && bytes[0] === 0xff && bytes[1] === 0xd8;
}

function isPng(bytes: Uint8Array) {
  return bytes.length > 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
}

export async function convertImage(input: { bytes: Uint8Array; filename: string; mime: string; target: OutputFormat }) {
  const plan = conversionPlan(input.filename, input.mime, input.target);
  if (plan.heic) throw new Error("HEIC is not decoded on the server. Convert it to JPEG or PNG first.");
  const { image } = await openImage(input.bytes);
  const encoded = await encode(image, input.target, 92);
  return { source: plan.source, ...packed(input.filename, input.target, encoded) };
}

export async function compressImage(input: {
  bytes: Uint8Array;
  filename: string;
  mime: string;
  choice: CompressChoice;
  quality: number;
  maxEdge: number | null;
}) {
  if (sniffFormat(input.filename, input.mime) === "heic") {
    throw new Error("HEIC is not decoded on the server. Convert it to JPEG or PNG first.");
  }
  const { image, size } = await openImage(input.bytes);
  const plan = compressionPlan({
    filename: input.filename,
    mime: input.mime,
    choice: input.choice,
    quality: input.quality,
    sourceWidth: size.width,
    sourceHeight: size.height,
    maxEdge: input.maxEdge,
    beforeBytes: input.bytes.byteLength,
    afterBytes: input.bytes.byteLength,
  });
  const resized = image.resize(plan.width, plan.height, { fit: "fill" });
  const encoded = await encode(resized, plan.format, plan.quality);
  const saved = savings(input.bytes.byteLength, encoded.bytes.byteLength);
  return {
    ...packed(input.filename, plan.format, encoded),
    format: plan.format,
    quality: clampQuality(input.quality),
    before: input.bytes.byteLength,
    after: encoded.bytes.byteLength,
    savedBytes: saved.savedBytes,
    savedPercent: saved.savedPercent,
    label: saved.label,
  };
}

export async function resizeImage(input: {
  bytes: Uint8Array;
  filename: string;
  mime: string;
  mode: ResizeMode;
  width: number | null;
  height: number | null;
  percent: number;
  lockAspect: boolean;
  fit: FitMode;
}) {
  if (sniffFormat(input.filename, input.mime) === "heic") {
    throw new Error("HEIC is not decoded on the server. Convert it to JPEG or PNG first.");
  }
  const { image, size } = await openImage(input.bytes);
  const format = resolveOutput(sniffFormat(input.filename, input.mime), "original");
  const dest = planResize({
    sourceWidth: size.width,
    sourceHeight: size.height,
    mode: input.mode,
    width: input.width,
    height: input.height,
    percent: input.percent,
    lockAspect: input.lockAspect,
  });
  const frame = placement(size.width, size.height, dest.width, dest.height, input.fit);
  const background =
    format === "jpeg" ? { r: 255, g: 255, b: 255, alpha: 1 } : { r: 0, g: 0, b: 0, alpha: 0 };
  let pipeline = image;
  if (input.fit === "cover") {
    const left = Math.max(0, Math.min(size.width - 1, Math.round(frame.sx)));
    const top = Math.max(0, Math.min(size.height - 1, Math.round(frame.sy)));
    const width = Math.max(1, Math.min(size.width - left, Math.round(frame.sw)));
    const height = Math.max(1, Math.min(size.height - top, Math.round(frame.sh)));
    pipeline = image.extract({ left, top, width, height }).resize(dest.width, dest.height, { fit: "fill" });
  } else if (input.fit === "contain") {
    pipeline = image.resize(dest.width, dest.height, { fit: "contain", background });
  } else {
    pipeline = image.resize(dest.width, dest.height, { fit: "fill" });
  }
  const encoded = await encode(pipeline, format, 90);
  return packed(input.filename || "image", format, encoded);
}
