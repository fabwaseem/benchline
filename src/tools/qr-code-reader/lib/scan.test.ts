import QRCode from "qrcode";
import { describe, expect, it } from "vitest";
import { encodeBase64 } from "@/lib/base64";
import { tool } from "@/tools/qr-code-reader/mcp";

describe("read barcode", () => {
  it("reads a generated QR code", async () => {
    const png = await QRCode.toBuffer("Hello Benchline", { type: "png", width: 256, margin: 2 });
    const result = await tool.run({
      file: { data: encodeBase64(new Uint8Array(png)), filename: "qr.png", mimeType: "image/png" },
    }) as { count: number; codes: { text: string; format: string }[] };
    expect(result.count).toBe(1);
    expect(result.codes[0]).toMatchObject({ text: "Hello Benchline", format: "QRCode" });
  });
});
