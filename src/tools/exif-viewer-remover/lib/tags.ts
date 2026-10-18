export type TagRow = { name: string; value: string };

export type GpsFix = { latitude: number; longitude: number; label: string; map: string };

const SKIP = new Set(["undefined", "null", ""]);

export function tagText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value
      .slice(0, 6)
      .map((item) => tagText(item))
      .filter(Boolean)
      .join(", ");
  }
  return "";
}

export function listTags(value: unknown, limit = 48): TagRow[] {
  if (!value || typeof value !== "object") return [];
  const rows: TagRow[] = [];
  for (const [name, raw] of Object.entries(value)) {
    const text = tagText(raw).slice(0, 180);
    if (!text || SKIP.has(text)) continue;
    rows.push({ name, value: text });
    if (rows.length >= limit) break;
  }
  return rows.sort((left, right) => left.name.localeCompare(right.name));
}

export function tagValue(rows: readonly TagRow[], names: readonly string[]) {
  for (const name of names) {
    const row = rows.find((item) => item.name.toLowerCase() === name.toLowerCase());
    if (row) return row.value;
  }
  return "";
}

export function formatGps(latitude: number, longitude: number): GpsFix | null {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  const lat = `${Math.abs(latitude).toFixed(5)}° ${latitude >= 0 ? "N" : "S"}`;
  const lng = `${Math.abs(longitude).toFixed(5)}° ${longitude >= 0 ? "E" : "W"}`;
  const map = `https://www.openstreetmap.org/?mlat=${latitude.toFixed(6)}&mlon=${longitude.toFixed(6)}#map=14/${latitude.toFixed(5)}/${longitude.toFixed(5)}`;
  return { latitude, longitude, label: `${lat}, ${lng}`, map };
}

export function isJpeg(bytes: Uint8Array) {
  return bytes.length > 2 && bytes[0] === 0xff && bytes[1] === 0xd8;
}

export function bytesToBinary(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return binary;
}

export function binaryToBytes(binary: string) {
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index) & 255;
  return bytes;
}
