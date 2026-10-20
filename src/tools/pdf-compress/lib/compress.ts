import { decode, encode } from "jpeg-js";
import {
  decodePDFRawStream,
  PDFBool,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFArray,
  PDFRawStream,
  PDFRef,
} from "pdf-lib";
import { assertByteSize } from "@/lib/format";

export const presets = ["light", "medium", "strong"] as const;
export type CompressPreset = (typeof presets)[number];

export const PRESET_STEP: Record<CompressPreset, { quality: number; scale: number }> = {
  light: { quality: 82, scale: 1 },
  medium: { quality: 60, scale: 1 },
  strong: { quality: 40, scale: 0.7 },
};

export const TARGET_BYTES = {
  none: null,
  "500": 500 * 1024,
  "200": 200 * 1024,
  "100": 100 * 1024,
} as const;

export type CompressOptions = {
  preset: CompressPreset;
  targetBytes: number | null;
};

export type CompressResult = {
  bytes: Uint8Array;
  before: number;
  after: number;
  saved: number;
  percent: number;
  pages: number;
  images: number;
  recompressed: number;
  metTarget: boolean;
  keptOriginal: boolean;
  note: string;
};

type Step = { quality: number; scale: number };

export function compressionSteps(preset: CompressPreset, targetBytes: number | null): Step[] {
  const start = PRESET_STEP[preset];
  if (targetBytes == null) return [start];
  const ladder: Step[] = [
    start,
    { quality: Math.min(start.quality, 70), scale: start.scale },
    { quality: Math.min(start.quality, 55), scale: Math.min(start.scale, 0.85) },
    { quality: 40, scale: Math.min(start.scale, 0.7) },
    { quality: 28, scale: 0.55 },
    { quality: 18, scale: 0.4 },
    { quality: 12, scale: 0.3 },
  ];
  const steps: Step[] = [];
  for (const step of ladder) {
    if (steps.some((item) => item.quality === step.quality && item.scale === step.scale)) continue;
    steps.push(step);
  }
  return steps;
}

export function compressionNote(input: {
  before: number;
  after: number;
  images: number;
  recompressed: number;
  keptOriginal: boolean;
  targetBytes: number | null;
  quality: number;
}) {
  const target = input.targetBytes == null ? "" : input.after <= input.targetBytes
    ? ` It is under the ${formatTarget(input.targetBytes)} target.`
    : ` It is still above the ${formatTarget(input.targetBytes)} target.`;
  if (input.keptOriginal) {
    return `The original file was already smaller, so it was kept.${target}`;
  }
  if (input.recompressed === 0) {
    return input.images === 0
      ? `No embedded images to recompress. Document info was cleared.${target}`
      : `None of the ${input.images} embedded images got smaller. Document info was cleared.${target}`;
  }
  return `Recompressed ${input.recompressed} of ${input.images} embedded images at ${input.quality}% quality. Text stays selectable.${target}`;
}

export async function compressPdf(data: Uint8Array, options: CompressOptions): Promise<CompressResult> {
  assertByteSize(data, "This PDF");
  const steps = compressionSteps(options.preset, options.targetBytes);
  let best: Pass | null = null;
  for (const step of steps) {
    const pass = await compressOnce(data, step);
    if (!best || pass.bytes.byteLength < best.bytes.byteLength) best = pass;
    if (options.targetBytes != null && pass.bytes.byteLength <= options.targetBytes) break;
  }
  if (!best) throw new Error("This PDF could not be compressed.");
  const keptOriginal = best.bytes.byteLength >= data.byteLength;
  const bytes = keptOriginal ? data : best.bytes;
  const after = bytes.byteLength;
  const before = data.byteLength;
  const saved = Math.max(0, before - after);
  const quality = best.quality;
  const recompressed = keptOriginal ? 0 : best.recompressed;
  const images = best.images;
  return {
    bytes,
    before,
    after,
    saved,
    percent: before === 0 ? 0 : Math.round((saved / before) * 1000) / 10,
    pages: best.pages,
    images,
    recompressed,
    metTarget: options.targetBytes == null || after <= options.targetBytes,
    keptOriginal,
    note: compressionNote({
      before,
      after,
      images,
      recompressed,
      keptOriginal,
      targetBytes: options.targetBytes,
      quality,
    }),
  };
}

type Pass = {
  bytes: Uint8Array;
  pages: number;
  images: number;
  recompressed: number;
  quality: number;
};

async function compressOnce(data: Uint8Array, step: Step): Promise<Pass> {
  const doc = await openPdf(data);
  try {
    return await compressLoaded(doc, step);
  } catch (error) {
    // pdf-lib loads damaged files leniently, so structural damage can surface
    // here as a raw internal error. Report it like any other unreadable PDF;
    // the tool's own messages (which start with "This ") pass through.
    if (error instanceof Error && error.message.startsWith("This ")) throw error;
    throw new Error("This PDF could not be read.");
  }
}

async function compressLoaded(doc: PDFDocument, step: Step): Promise<Pass> {
  const pages = doc.getPageCount();
  if (pages < 1) throw new Error("This PDF has no pages.");
  stripMetadata(doc);
  const objects = doc.context.enumerateIndirectObjects();
  const maskRefs = new Set<string>();
  for (const [, object] of objects) {
    if (!(object instanceof PDFRawStream)) continue;
    const mask = object.dict.get(PDFName.of("SMask"));
    if (mask instanceof PDFRef) maskRefs.add(mask.toString());
  }
  let images = 0;
  let recompressed = 0;
  for (const [ref, object] of objects) {
    if (!(object instanceof PDFRawStream)) continue;
    if (maskRefs.has(ref.toString())) continue;
    if (object.dict.lookup(PDFName.of("Subtype")) !== PDFName.of("Image")) continue;
    if (object.dict.lookup(PDFName.of("ImageMask")) === PDFBool.True) continue;
    images += 1;
    if (recompressImage(doc, ref, object, step)) recompressed += 1;
  }
  let bytes: Uint8Array;
  try {
    bytes = await doc.save({ useObjectStreams: true });
  } catch {
    bytes = await doc.save();
  }
  return { bytes, pages, images, recompressed, quality: step.quality };
}

function recompressImage(doc: PDFDocument, ref: PDFRef, stream: PDFRawStream, step: Step) {
  try {
    const width = integerOf(stream.dict, "Width");
    const height = integerOf(stream.dict, "Height");
    const bits = integerOf(stream.dict, "BitsPerComponent");
    const components = colorComponents(stream.dict);
    if (width == null || height == null || bits !== 8 || components == null) return false;
    if (width < 1 || height < 1 || width * height > 24_000_000) return false;
    if (stream.dict.lookup(PDFName.of("Decode"))) return false;
    const filters = filterNames(stream.dict);
    let rgba: Uint8Array;
    let pixelWidth = width;
    let pixelHeight = height;
    if (filters.length === 1 && filters[0] === "DCTDecode") {
      const decoded = decode(stream.getContents(), { useTArray: true, formatAsRGBA: true, tolerantDecoding: true });
      if (decoded.width !== width || decoded.height !== height) return false;
      rgba = decoded.data;
    } else if (filters.length === 1 && filters[0] === "FlateDecode") {
      const samples = flateSamples(stream, width, height, components);
      if (!samples) return false;
      rgba = samplesToRgba(samples, width, height, components);
    } else {
      return false;
    }
    const scaled = step.scale < 0.999 ? scaleRgba(rgba, pixelWidth, pixelHeight, step.scale) : { data: rgba, width: pixelWidth, height: pixelHeight };
    pixelWidth = scaled.width;
    pixelHeight = scaled.height;
    const quality = Math.min(100, Math.max(1, Math.round(step.quality)));
    const encoded = encode({ data: scaled.data, width: pixelWidth, height: pixelHeight }, quality);
    const jpeg = toBytes(encoded.data);
    if (jpeg.byteLength === 0 || jpeg[0] !== 0xff || jpeg[1] !== 0xd8) return false;
    if (jpeg.byteLength >= stream.getContents().byteLength) return false;
    stream.dict.set(PDFName.of("Filter"), PDFName.of("DCTDecode"));
    stream.dict.set(PDFName.of("Width"), PDFNumber.of(pixelWidth));
    stream.dict.set(PDFName.of("Height"), PDFNumber.of(pixelHeight));
    stream.dict.set(PDFName.of("ColorSpace"), PDFName.of("DeviceRGB"));
    stream.dict.set(PDFName.of("BitsPerComponent"), PDFNumber.of(8));
    stream.dict.delete(PDFName.of("DecodeParms"));
    stream.dict.delete(PDFName.of("Decode"));
    if (pixelWidth !== width || pixelHeight !== height) stream.dict.delete(PDFName.of("SMask"));
    doc.context.assign(ref, PDFRawStream.of(stream.dict, jpeg));
    return true;
  } catch {
    return false;
  }
}

function flateSamples(stream: PDFRawStream, width: number, height: number, components: number) {
  const raw = new Uint8Array(decodePDFRawStream(stream).decode());
  const parms = stream.dict.lookup(PDFName.of("DecodeParms"));
  let predictor = 1;
  let colors = components;
  let columns = width;
  let bits = 8;
  if (parms instanceof PDFDict) {
    predictor = numberOf(parms, "Predictor", 1);
    colors = numberOf(parms, "Colors", components);
    columns = numberOf(parms, "Columns", width);
    bits = numberOf(parms, "BitsPerComponent", 8);
  }
  if (bits !== 8 || colors !== components || columns !== width) return null;
  const expected = width * height * components;
  if (predictor === 1) return raw.byteLength >= expected ? raw.subarray(0, expected) : null;
  if (predictor === 2) return raw.byteLength >= expected ? undoTiffPredictor(raw.subarray(0, expected), width, components) : null;
  if (predictor >= 10 && predictor <= 15) {
    const samples = undoPngPredictor(raw, width, components);
    return samples.byteLength === expected ? samples : null;
  }
  return null;
}

export function undoPngPredictor(data: Uint8Array, columns: number, colors: number) {
  const stride = columns * colors;
  const rowSize = stride + 1;
  if (stride < 1 || data.byteLength % rowSize !== 0) throw new Error("The image predictor data does not match its width.");
  const rows = data.byteLength / rowSize;
  const out = new Uint8Array(rows * stride);
  for (let row = 0; row < rows; row += 1) {
    const filter = data[row * rowSize] ?? 0;
    const source = data.subarray(row * rowSize + 1, row * rowSize + 1 + stride);
    const dest = out.subarray(row * stride, (row + 1) * stride);
    const previous = row === 0 ? new Uint8Array(stride) : out.subarray((row - 1) * stride, row * stride);
    if (filter === 0) dest.set(source);
    else if (filter === 1) addLeft(dest, source, colors);
    else if (filter === 2) addUp(dest, source, previous);
    else if (filter === 3) addAverage(dest, source, previous, colors);
    else if (filter === 4) addPaeth(dest, source, previous, colors);
    else throw new Error("The image uses an unknown row filter.");
  }
  return out;
}

export function scaleRgba(data: Uint8Array, width: number, height: number, scale: number) {
  if (scale >= 0.999) return { data, width, height };
  const nextWidth = Math.max(1, Math.round(width * scale));
  const nextHeight = Math.max(1, Math.round(height * scale));
  const out = new Uint8Array(nextWidth * nextHeight * 4);
  for (let y = 0; y < nextHeight; y += 1) {
    const startY = Math.floor((y * height) / nextHeight);
    const endY = Math.max(startY + 1, Math.floor(((y + 1) * height) / nextHeight));
    for (let x = 0; x < nextWidth; x += 1) {
      const startX = Math.floor((x * width) / nextWidth);
      const endX = Math.max(startX + 1, Math.floor(((x + 1) * width) / nextWidth));
      let red = 0;
      let green = 0;
      let blue = 0;
      let alpha = 0;
      let count = 0;
      for (let sampleY = startY; sampleY < endY; sampleY += 1) {
        for (let sampleX = startX; sampleX < endX; sampleX += 1) {
          const index = (sampleY * width + sampleX) * 4;
          red += data[index] ?? 0;
          green += data[index + 1] ?? 0;
          blue += data[index + 2] ?? 0;
          alpha += data[index + 3] ?? 0;
          count += 1;
        }
      }
      const offset = (y * nextWidth + x) * 4;
      out[offset] = Math.round(red / count);
      out[offset + 1] = Math.round(green / count);
      out[offset + 2] = Math.round(blue / count);
      out[offset + 3] = Math.round(alpha / count);
    }
  }
  return { data: out, width: nextWidth, height: nextHeight };
}

function samplesToRgba(samples: Uint8Array, width: number, height: number, components: number) {
  const rgba = new Uint8Array(width * height * 4);
  if (components === 3) {
    for (let index = 0, pixel = 0; index < samples.length; index += 3, pixel += 4) {
      rgba[pixel] = samples[index] ?? 0;
      rgba[pixel + 1] = samples[index + 1] ?? 0;
      rgba[pixel + 2] = samples[index + 2] ?? 0;
      rgba[pixel + 3] = 255;
    }
    return rgba;
  }
  for (let index = 0, pixel = 0; index < samples.length; index += 1, pixel += 4) {
    const value = samples[index] ?? 0;
    rgba[pixel] = value;
    rgba[pixel + 1] = value;
    rgba[pixel + 2] = value;
    rgba[pixel + 3] = 255;
  }
  return rgba;
}

function undoTiffPredictor(data: Uint8Array, columns: number, colors: number) {
  const stride = columns * colors;
  const out = new Uint8Array(data.byteLength);
  const rows = Math.floor(data.byteLength / stride);
  for (let row = 0; row < rows; row += 1) {
    for (let index = 0; index < stride; index += 1) {
      const left = index >= colors ? out[row * stride + index - colors] ?? 0 : 0;
      out[row * stride + index] = ((data[row * stride + index] ?? 0) + left) & 255;
    }
  }
  return out;
}

function addLeft(dest: Uint8Array, source: Uint8Array, colors: number) {
  for (let index = 0; index < dest.length; index += 1) {
    const left = index >= colors ? dest[index - colors] ?? 0 : 0;
    dest[index] = ((source[index] ?? 0) + left) & 255;
  }
}

function addUp(dest: Uint8Array, source: Uint8Array, previous: Uint8Array) {
  for (let index = 0; index < dest.length; index += 1) dest[index] = ((source[index] ?? 0) + (previous[index] ?? 0)) & 255;
}

function addAverage(dest: Uint8Array, source: Uint8Array, previous: Uint8Array, colors: number) {
  for (let index = 0; index < dest.length; index += 1) {
    const left = index >= colors ? dest[index - colors] ?? 0 : 0;
    dest[index] = ((source[index] ?? 0) + Math.floor((left + (previous[index] ?? 0)) / 2)) & 255;
  }
}

function addPaeth(dest: Uint8Array, source: Uint8Array, previous: Uint8Array, colors: number) {
  for (let index = 0; index < dest.length; index += 1) {
    const left = index >= colors ? dest[index - colors] ?? 0 : 0;
    const up = previous[index] ?? 0;
    const upLeft = index >= colors ? previous[index - colors] ?? 0 : 0;
    dest[index] = ((source[index] ?? 0) + paeth(left, up, upLeft)) & 255;
  }
}

function paeth(left: number, up: number, upLeft: number) {
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const diagonal = Math.abs(estimate - upLeft);
  if (leftDistance <= upDistance && leftDistance <= diagonal) return left;
  if (upDistance <= diagonal) return up;
  return upLeft;
}

function filterNames(dict: PDFDict) {
  const filter = dict.lookup(PDFName.of("Filter"));
  if (filter instanceof PDFName) return [filter.decodeText()];
  if (filter instanceof PDFArray) {
    const names: string[] = [];
    for (let index = 0; index < filter.size(); index += 1) {
      const item = filter.lookup(index);
      if (item instanceof PDFName) names.push(item.decodeText());
    }
    return names;
  }
  return [];
}

function colorComponents(dict: PDFDict) {
  const space = dict.lookup(PDFName.of("ColorSpace"));
  if (space === PDFName.of("DeviceRGB")) return 3;
  if (space === PDFName.of("DeviceGray")) return 1;
  return null;
}

function integerOf(dict: PDFDict, key: string) {
  const value = dict.lookup(PDFName.of(key));
  if (!(value instanceof PDFNumber)) return null;
  const number = value.asNumber();
  return Number.isInteger(number) ? number : null;
}

function numberOf(dict: PDFDict, key: string, fallback: number) {
  const value = dict.lookup(PDFName.of(key));
  return value instanceof PDFNumber ? value.asNumber() : fallback;
}

function stripMetadata(doc: PDFDocument) {
  const info = doc.context.lookup(doc.context.trailerInfo.Info);
  if (info instanceof PDFDict) {
    for (const key of ["Title", "Author", "Subject", "Keywords", "Creator"]) info.delete(PDFName.of(key));
  }
  doc.catalog.delete(PDFName.of("Metadata"));
}

async function openPdf(data: Uint8Array) {
  try {
    return await PDFDocument.load(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("encrypted")) throw new Error("This PDF is encrypted. Remove the password first.");
    if (message.includes("No PDF header") || message.includes("Failed to parse")) throw new Error("This file is not a PDF.");
    throw new Error("This PDF could not be read.");
  }
}

function toBytes(data: Uint8Array) {
  return new Uint8Array(data);
}

function formatTarget(bytes: number) {
  if (bytes % (1024 * 1024) === 0) return `${bytes / (1024 * 1024)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}
