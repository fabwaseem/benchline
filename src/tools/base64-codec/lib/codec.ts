export type EncodeOptions = {
  urlSafe: boolean;
  dataUri: boolean;
  mime: string;
};

export type DecodeResult =
  | { ok: true; bytes: Uint8Array; text: string | null; mime: string; filename: string }
  | { ok: false; error: string };

const encoder = new TextEncoder();

export const exampleText = "Ada Lovelace";

export function encodeText(text: string, options: EncodeOptions): string {
  return encodeBytes(encoder.encode(text), { ...options, mime: options.mime || "text/plain;charset=utf-8" });
}

export function encodeBytes(bytes: Uint8Array, options: EncodeOptions): string {
  const standard = bytesToBase64(bytes);
  if (options.dataUri) return `data:${options.mime || "application/octet-stream"};base64,${standard}`;
  return options.urlSafe ? toUrlSafe(standard) : standard;
}

export function decodeBase64(input: string): DecodeResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "Enter base64 to decode." };
  const dataUri = parseDataUri(trimmed);
  const payload = dataUri ? dataUri.data : trimmed;
  const declaredMime = dataUri?.mime ?? "";
  if (dataUri && !dataUri.base64) {
    try {
      const text = decodeURIComponent(payload);
      const bytes = encoder.encode(text);
      const mime = declaredMime || sniffMime(bytes);
      return { ok: true, bytes, text, mime, filename: filenameFor(mime) };
    } catch {
      return { ok: false, error: "The data URI text could not be decoded." };
    }
  }
  const decoded = decodeBytes(payload);
  if (!decoded.ok) return decoded;
  const text = bytesToText(decoded.bytes);
  const mime = declaredMime || sniffMime(decoded.bytes);
  return { ok: true, bytes: decoded.bytes, text, mime, filename: filenameFor(mime) };
}

export function decodeBytes(input: string): { ok: true; bytes: Uint8Array } | { ok: false; error: string } {
  const compact = input.replace(/\s+/g, "");
  if (!compact) return { ok: false, error: "Enter base64 to decode." };
  if (!/^[A-Za-z0-9+/_-]*={0,2}$/.test(compact)) return { ok: false, error: "Invalid base64 character." };
  if (compact.length % 4 === 1) return { ok: false, error: "Invalid base64 length." };
  const standard = fromUrlSafe(compact);
  try {
    const binary = atob(standard);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return { ok: true, bytes };
  } catch {
    return { ok: false, error: "Invalid base64." };
  }
}

export function sniffMime(bytes: Uint8Array): string {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47])) return "image/png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a") return "image/gif";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return "image/webp";
  if (ascii(bytes, 0, 4) === "%PDF") return "application/pdf";
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) return "application/zip";
  const text = bytesToText(bytes);
  if (text === null) return "application/octet-stream";
  const trimmed = text.trimStart();
  if (trimmed.startsWith("<svg") || (trimmed.startsWith("<?xml") && trimmed.includes("<svg"))) return "image/svg+xml";
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      JSON.parse(trimmed);
      return "application/json";
    } catch {
      return "text/plain";
    }
  }
  return "text/plain";
}

export function filenameFor(mime: string): string {
  const base = mime.split(";")[0]?.trim().toLowerCase() ?? "";
  const ext: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "application/pdf": "pdf",
    "application/zip": "zip",
    "application/json": "json",
    "text/plain": "txt",
  };
  return `decoded.${ext[base] ?? "bin"}`;
}

export function parseDataUri(input: string): { mime: string; base64: boolean; data: string } | null {
  const match = /^data:([^,]*),([\s\S]*)$/.exec(input.trim());
  if (!match) return null;
  const meta = match[1] ?? "";
  const parts = meta.split(";").filter((part) => part.length > 0);
  const mime = parts[0]?.includes("/") ? parts[0] : "";
  return { mime, base64: parts.includes("base64"), data: match[2] ?? "" };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

function toUrlSafe(value: string): string {
  return value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromUrlSafe(value: string): string {
  const standard = value.replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/g, "");
  const pad = standard.length % 4 === 0 ? "" : "=".repeat(4 - (standard.length % 4));
  return standard + pad;
}

function bytesToText(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function startsWith(bytes: Uint8Array, magic: number[]): boolean {
  if (bytes.length < magic.length) return false;
  return magic.every((byte, index) => bytes[index] === byte);
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  if (bytes.length < start + length) return "";
  let out = "";
  for (let index = 0; index < length; index += 1) out += String.fromCharCode(bytes[start + index] ?? 0);
  return out;
}
