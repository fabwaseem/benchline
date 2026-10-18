import { describe, expect, it } from "vitest";
import { decodeBase64, decodeBytes, encodeBytes, encodeText, exampleText, filenameFor, sniffMime } from "@/tools/base64-codec/lib/codec";

describe("base64 codec", () => {
  it("round-trips unicode text", () => {
    const encoded = encodeText("café 雪", { urlSafe: false, dataUri: false, mime: "text/plain" });
    const decoded = decodeBase64(encoded);
    expect(decoded.ok && decoded.text).toBe("café 雪");
  });

  it("writes URL-safe base64 without padding", () => {
    const bytes = new Uint8Array([0xfb, 0xff, 0xbf]);
    const standard = encodeBytes(bytes, { urlSafe: false, dataUri: false, mime: "application/octet-stream" });
    const urlSafe = encodeBytes(bytes, { urlSafe: true, dataUri: false, mime: "application/octet-stream" });
    expect(standard).toContain("+");
    expect(standard.endsWith("=") || standard.includes("/")).toBe(true);
    expect(urlSafe).not.toMatch(/[+/=]/);
    const decoded = decodeBytes(urlSafe);
    expect(decoded.ok && [...decoded.bytes]).toEqual([0xfb, 0xff, 0xbf]);
  });

  it("decodes wrapped base64 and data URIs", () => {
    const encoded = encodeText(exampleText, { urlSafe: false, dataUri: false, mime: "text/plain" });
    const wrapped = encoded.replace(/(.{4})/g, "$1\n");
    expect(decodeBase64(wrapped).ok && decodeBase64(wrapped)).toMatchObject({ text: exampleText });
    const uri = encodeText(exampleText, { urlSafe: true, dataUri: true, mime: "text/plain" });
    expect(uri.startsWith("data:text/plain;base64,")).toBe(true);
    expect(uri).not.toContain("-");
    expect(decodeBase64(uri)).toMatchObject({ ok: true, text: exampleText, mime: "text/plain" });
    expect(decodeBase64("data:text/plain,Ada%20Lovelace")).toMatchObject({ text: "Ada Lovelace" });
  });

  it("rejects bad input", () => {
    expect(decodeBase64("")).toMatchObject({ ok: false });
    expect(decodeBase64("@@@@")).toMatchObject({ error: "Invalid base64 character." });
    expect(decodeBase64("abcde")).toMatchObject({ error: "Invalid base64 length." });
  });

  it("sniffs common file types", () => {
    expect(sniffMime(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(sniffMime(Uint8Array.from([0xff, 0xd8, 0xff, 0x00]))).toBe("image/jpeg");
    expect(sniffMime(new TextEncoder().encode("%PDF-1.7"))).toBe("application/pdf");
    expect(sniffMime(new TextEncoder().encode('{"a":1}'))).toBe("application/json");
    expect(sniffMime(new TextEncoder().encode("<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>"))).toBe("image/svg+xml");
    expect(sniffMime(Uint8Array.from([0x00, 0x01, 0x02, 0xff]))).toBe("application/octet-stream");
    expect(filenameFor("image/png")).toBe("decoded.png");
    expect(filenameFor("application/octet-stream")).toBe("decoded.bin");
  });

  it("returns null text for bytes that are not UTF-8", () => {
    const encoded = encodeBytes(Uint8Array.from([0xff, 0xfe, 0xfd]), { urlSafe: false, dataUri: false, mime: "application/octet-stream" });
    const decoded = decodeBase64(encoded);
    expect(decoded.ok && decoded.text).toBeNull();
    expect(decoded.ok && decoded.mime).toBe("application/octet-stream");
  });
});
