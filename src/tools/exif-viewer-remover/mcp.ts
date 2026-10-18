import sharp from "sharp";
import { z } from "zod";
import { encodeBase64 } from "@/lib/base64";
import { mimeFor, outputFilename, resolveOutput, sniffFormat } from "@/lib/image-format";
import { mcpFileSchema, readMcpBytes } from "@/lib/mcp/bytes";
import type { BenchTool } from "@/lib/mcp/types";
import { stripJpegGps } from "@/tools/exif-viewer-remover/lib/gps";
import { readExif } from "@/tools/exif-viewer-remover/lib/read";
import { isJpeg } from "@/tools/exif-viewer-remover/lib/tags";

const MAX_EDGE = 8192;

export const inputSchema = z.object({
  file: mcpFileSchema.describe("The photo. Provide url or data."),
  action: z.enum(["read", "strip"]).default("read"),
  scope: z.enum(["all", "gps"]).default("all").describe("Used when action is strip. gps removes the GPS block from a JPEG. all re-encodes and drops every tag."),
});

const gpsSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  label: z.string(),
  map: z.string(),
}).nullable();

export const outputSchema = z.object({
  filename: z.string(),
  mime: z.string(),
  width: z.number().int(),
  height: z.number().int(),
  bytes: z.number().int(),
  data: z.string().describe("Cleaned image as base64. Empty when action is read."),
  stripped: z.enum(["none", "all", "gps"]),
  camera: z.string(),
  when: z.string(),
  gps: gpsSchema,
  tags: z.array(z.object({ name: z.string(), value: z.string() })),
  note: z.string(),
});

async function measure(bytes: Uint8Array) {
  try {
    const meta = await sharp(bytes, { failOn: "none", limitInputPixels: MAX_EDGE * MAX_EDGE, animated: false }).metadata();
    return { width: meta.width ?? 0, height: meta.height ?? 0 };
  } catch {
    return { width: 0, height: 0 };
  }
}

async function stripAll(bytes: Uint8Array, filename: string, mime: string) {
  const kind = sniffFormat(filename, mime);
  if (kind === "heic") throw new Error("HEIC is not decoded on the server. Convert it to JPEG or PNG first.");
  const format = resolveOutput(kind, "original");
  try {
    const image = sharp(bytes, { failOn: "none", limitInputPixels: MAX_EDGE * MAX_EDGE, animated: false }).rotate();
    const meta = await image.metadata();
    if ((meta.width ?? 0) > MAX_EDGE || (meta.height ?? 0) > MAX_EDGE) {
      throw new Error("The image is larger than 8192 pixels on a side.");
    }
    const pipeline = format === "jpeg"
      ? image.jpeg({ quality: 92, mozjpeg: true })
      : format === "webp"
        ? image.webp({ quality: 90 })
        : format === "avif"
          ? image.avif({ quality: 55 })
          : image.png();
    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
    return {
      bytes: new Uint8Array(data),
      width: info.width,
      height: info.height,
      mime: mimeFor(format),
      filename: outputFilename(filename, format),
    };
  } catch (error) {
    if (error instanceof Error && /8192/.test(error.message)) throw error;
    throw new Error("This image could not be re-encoded. Use JPEG, PNG, WebP, AVIF, or GIF.");
  }
}

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const file = await readMcpBytes(parsed.file, "Image");
  const report = await readExif(file.bytes);
  const size = await measure(file.bytes);
  if (parsed.action === "read") {
    return outputSchema.parse({
      filename: file.filename || "photo",
      mime: file.mimeType || "",
      width: size.width,
      height: size.height,
      bytes: 0,
      data: "",
      stripped: "none",
      camera: report.camera,
      when: report.when,
      gps: report.gps,
      tags: report.tags,
      note: report.tags.length === 0 ? "No readable metadata." : `${report.tags.length} tags.`,
    });
  }
  if (parsed.scope === "gps" && isJpeg(file.bytes)) {
    const cleaned = stripJpegGps(file.bytes);
    return outputSchema.parse({
      filename: file.filename || "photo.jpg",
      mime: "image/jpeg",
      width: size.width,
      height: size.height,
      bytes: cleaned.byteLength,
      data: encodeBase64(cleaned),
      stripped: "gps",
      camera: report.camera,
      when: report.when,
      gps: report.gps,
      tags: report.tags,
      note: "The GPS block was removed. The other JPEG tags were kept.",
    });
  }
  const cleaned = await stripAll(file.bytes, file.filename || "photo", file.mimeType || "");
  const note = parsed.scope === "gps"
    ? "This format has no separate GPS block, so the file was re-encoded and every tag was removed."
    : "The file was re-encoded without metadata.";
  return outputSchema.parse({
    filename: cleaned.filename,
    mime: cleaned.mime,
    width: cleaned.width,
    height: cleaned.height,
    bytes: cleaned.bytes.byteLength,
    data: encodeBase64(cleaned.bytes),
    stripped: "all",
    camera: report.camera,
    when: report.when,
    gps: report.gps,
    tags: report.tags,
    note,
  });
}

export const tool: BenchTool = {
  slug: "exif-viewer-remover",
  name: "read_exif",
  title: "Read or strip photo metadata",
  description: "Read EXIF tags, including GPS, or strip them. action is read or strip. scope is all or gps. gps-only removal keeps the other JPEG tags. Other formats are re-encoded, which drops every tag. Send base64 or a public URL. Private addresses are refused and the decoded file is capped at 10 MB.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
