import { assertByteSize } from "@/lib/format";

export function encodeBase64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

export function decodeBase64(value: string, label: string) {
  const clean = value.trim().replace(/^data:[^;]+;base64,/, "").replace(/\s/g, "");
  if (!clean) throw new Error(`${label} is empty.`);
  let binary: string;
  try {
    binary = atob(clean);
  } catch {
    throw new Error(`${label} is not valid base64.`);
  }
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index) & 255;
  assertByteSize(bytes, label);
  return bytes;
}
