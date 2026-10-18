import { strToU8, unzipSync, zipSync, type UnzipFileInfo } from "fflate";

export type ZipEntry = { name: string; data: Uint8Array };

export const MAX_ZIP_FILES = 200;
export const MAX_ZIP_BYTES = 100 * 1024 * 1024;
/** Uncompressed cap for the server unzip path. Checked on declared sizes before inflation. */
export const SERVER_UNZIP_BYTES = 10 * 1024 * 1024;

export class ArchiveTooLargeError extends Error {
  constructor(message = "Archive too large.") {
    super(message);
    this.name = "ArchiveTooLargeError";
  }
}

export type UnzipLimits = { maxBytes?: number };

export function sanitizeEntryName(name: string): string | null {
  const cleaned = name.replace(/\\/g, "/").replace(/^\/+/, "").trim();
  if (cleaned.length === 0) return null;
  const parts = cleaned.split("/");
  if (parts.some((part) => part === ".." || part.length === 0)) return null;
  return parts.join("/");
}

export function zipEntries(entries: ZipEntry[]): Uint8Array {
  if (entries.length === 0) throw new Error("Add at least one file.");
  if (entries.length > MAX_ZIP_FILES) throw new Error(`Too many files (max ${MAX_ZIP_FILES}).`);
  let total = 0;
  const record: Record<string, Uint8Array> = {};
  const seen = new Set<string>();
  for (const entry of entries) {
    const name = sanitizeEntryName(entry.name);
    if (!name) throw new Error(`Bad file name: ${entry.name}.`);
    if (seen.has(name)) throw new Error(`Duplicate name: ${name}.`);
    seen.add(name);
    total += entry.data.byteLength;
    if (total > MAX_ZIP_BYTES) throw new Error("The files are too large to zip (100 MB cap).");
    record[name] = entry.data;
  }
  return zipSync(record, { level: 6 });
}

export function unzipEntries(data: Uint8Array, limits: UnzipLimits = {}): ZipEntry[] {
  const maxBytes = limits.maxBytes ?? MAX_ZIP_BYTES;
  let declaredBytes = 0;
  let declaredCount = 0;
  let record: Record<string, Uint8Array>;
  try {
    record = unzipSync(data, {
      filter(file: UnzipFileInfo) {
        declaredCount += 1;
        declaredBytes += file.originalSize;
        if (declaredCount > MAX_ZIP_FILES || declaredBytes > maxBytes) {
          throw new ArchiveTooLargeError("Archive too large.");
        }
        return true;
      },
    });
  } catch (error) {
    if (error instanceof ArchiveTooLargeError) throw error;
    throw new Error("That file is not a valid ZIP archive.");
  }
  const entries = Object.entries(record);
  if (entries.length === 0) throw new Error("The archive is empty.");
  const out: ZipEntry[] = [];
  let total = 0;
  for (const [rawName, bytes] of entries) {
    if (rawName.endsWith("/")) continue;
    const name = sanitizeEntryName(rawName);
    if (!name) continue;
    total += bytes.byteLength;
    if (total > maxBytes) throw new ArchiveTooLargeError("Archive too large.");
    out.push({ name, data: bytes });
  }
  if (out.length === 0) throw new Error("The archive has no files.");
  return out;
}

export function textEntry(name: string, text: string): ZipEntry {
  return { name, data: strToU8(text) };
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unit]}`;
}

export function zipFileName(when: Date = new Date()): string {
  return `archive-${when.toISOString().slice(0, 10)}.zip`;
}

export function isZipName(name: string): boolean {
  return name.toLowerCase().endsWith(".zip");
}
