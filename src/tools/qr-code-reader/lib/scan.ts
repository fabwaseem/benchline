import { readBarcodes } from "zxing-wasm/reader";
import { presentCodes } from "@/tools/qr-code-reader/lib/codes";

export async function scanBarcodes(input: Blob | Uint8Array | ImageData) {
  try {
    const results = await readBarcodes(input, { tryHarder: true, maxNumberOfSymbols: 8 });
    return presentCodes(results.map((result) => ({ format: result.format, text: result.text })));
  } catch (error) {
    if (error instanceof Error && /could not be decoded/.test(error.message)) throw error;
    throw new Error("This image could not be decoded. Use a PNG, JPEG, WebP, or GIF.");
  }
}
