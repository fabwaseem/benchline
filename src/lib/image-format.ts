export const outputFormats = ["jpeg", "png", "webp", "avif"] as const;

export type OutputFormat = (typeof outputFormats)[number];

export const sourceKinds = ["jpeg", "png", "webp", "avif", "gif", "heic", "unknown"] as const;

export type SourceKind = (typeof sourceKinds)[number];

export const IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/avif,image/gif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.avif,.gif,.heic,.heif";

const BY_EXT: Record<string, SourceKind> = {
  jpg: "jpeg",
  jpeg: "jpeg",
  png: "png",
  webp: "webp",
  avif: "avif",
  gif: "gif",
  heic: "heic",
  heif: "heic",
};

const BY_MIME: Record<string, SourceKind> = {
  "image/jpeg": "jpeg",
  "image/jpg": "jpeg",
  "image/pjpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heic",
  "image/heic-sequence": "heic",
  "image/heif-sequence": "heic",
};

export function sniffFormat(filename: string, mime: string): SourceKind {
  const clean = mime.toLowerCase().split(";")[0]?.trim() ?? "";
  const fromMime = BY_MIME[clean];
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  const fromExt = filename.includes(".") ? BY_EXT[ext] : undefined;
  return fromMime ?? fromExt ?? "unknown";
}

export function isHeic(filename: string, mime: string): boolean {
  return sniffFormat(filename, mime) === "heic";
}

export function extensionFor(format: OutputFormat): string {
  return format === "jpeg" ? "jpg" : format;
}

export function mimeFor(format: OutputFormat): string {
  return format === "jpeg" ? "image/jpeg" : `image/${format}`;
}

export function outputFilename(filename: string, format: OutputFormat): string {
  const trimmed = filename.trim();
  const base = trimmed.includes(".") ? trimmed.replace(/\.[^.]+$/, "") : trimmed;
  const stem = base.trim() || "image";
  return `${stem}.${extensionFor(format)}`;
}

export function resolveOutput(source: SourceKind, choice: OutputFormat | "original"): OutputFormat {
  if (choice !== "original") return choice;
  if (source === "jpeg" || source === "png" || source === "webp" || source === "avif") return source;
  return "jpeg";
}

export function clampQuality(value: number): number {
  if (!Number.isFinite(value)) return 80;
  return Math.min(100, Math.max(1, Math.round(value)));
}

export function encoderQuality(value: number): number {
  return clampQuality(value) / 100;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const units = ["KB", "MB", "GB"] as const;
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${units[unit]}`;
}

export function savings(before: number, after: number): { savedBytes: number; savedPercent: number; label: string } {
  if (!Number.isFinite(before) || before <= 0 || !Number.isFinite(after) || after < 0) {
    return { savedBytes: 0, savedPercent: 0, label: "0% smaller" };
  }
  const savedBytes = before - after;
  const savedPercent = (savedBytes / before) * 100;
  const rounded = Math.abs(savedPercent) >= 10 ? Math.round(savedPercent) : Math.round(savedPercent * 10) / 10;
  if (savedBytes >= 0) return { savedBytes, savedPercent, label: `${rounded}% smaller` };
  return { savedBytes, savedPercent, label: `${Math.abs(rounded)}% larger` };
}

export function capBox(width: number, height: number, maxEdge: number | null): { width: number; height: number } {
  const w = Math.max(1, Math.round(Number.isFinite(width) ? width : 1));
  const h = Math.max(1, Math.round(Number.isFinite(height) ? height : 1));
  if (maxEdge === null || !Number.isFinite(maxEdge) || maxEdge <= 0) return { width: w, height: h };
  const edge = Math.max(1, Math.round(maxEdge));
  const longest = Math.max(w, h);
  if (longest <= edge) return { width: w, height: h };
  const scale = edge / longest;
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}
