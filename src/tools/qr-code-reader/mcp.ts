import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import sharp from "sharp";
import { z } from "zod";
import { mcpFileSchema, readMcpBytes } from "@/lib/mcp/bytes";
import type { BenchTool } from "@/lib/mcp/types";
import { prepareZXingModule } from "zxing-wasm/reader";
import { scanBarcodes } from "@/tools/qr-code-reader/lib/scan";

const MAX_EDGE = 4096;

let prepared: Promise<void> | null = null;

function prepareNodeReader() {
  prepared ??= Promise.resolve().then(() => {
    const require = createRequire(`${process.cwd()}/package.json`);
    const wasmPath = require.resolve("zxing-wasm/reader/zxing_reader.wasm");
    const wasm = readFileSync(wasmPath);
    const binary = wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength) as ArrayBuffer;
    prepareZXingModule({ overrides: { wasmBinary: binary } });
  });
  return prepared;
}

export const inputSchema = z.object({
  file: mcpFileSchema.describe("The image. Provide url or data."),
});

export const outputSchema = z.object({
  count: z.number().int(),
  codes: z.array(z.object({
    text: z.string(),
    format: z.string(),
    label: z.string(),
  })),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const file = await readMcpBytes(parsed.file, "Image");
  await prepareNodeReader();
  let png: Uint8Array;
  try {
    const image = sharp(file.bytes, { failOn: "none", limitInputPixels: MAX_EDGE * MAX_EDGE, animated: false }).rotate();
    const meta = await image.metadata();
    if (!meta.width || !meta.height) throw new Error("The image has no pixels.");
    if (meta.width > MAX_EDGE || meta.height > MAX_EDGE) throw new Error("The image is larger than 4096 pixels on a side.");
    png = new Uint8Array(await image.png().toBuffer());
  } catch (error) {
    if (error instanceof Error && /4096|no pixels/.test(error.message)) throw error;
    throw new Error("This image could not be decoded. Use a PNG, JPEG, WebP, or GIF.");
  }
  const codes = await scanBarcodes(png);
  return outputSchema.parse({ count: codes.length, codes });
}

export const tool: BenchTool = {
  slug: "qr-code-reader",
  name: "read_barcode",
  title: "Read a QR code or barcode",
  description: "Read QR codes and barcodes from an image. Send base64 or a public URL. Private addresses are refused and the decoded file is capped at 10 MB. Returns each code's text and format. An image with no code returns an empty list.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
