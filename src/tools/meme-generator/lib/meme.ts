export type MemeStyle = {
  id: string;
  name: string;
  from: string;
  to: string;
};

export const MEME_STYLES: MemeStyle[] = [
  { id: "sunset", name: "Sunset", from: "#f97316", to: "#7c2d12" },
  { id: "ocean", name: "Ocean", from: "#0ea5e9", to: "#0c4a6e" },
  { id: "grape", name: "Grape", from: "#a855f7", to: "#3b0764" },
  { id: "forest", name: "Forest", from: "#22c55e", to: "#14532d" },
  { id: "mono", name: "Mono", from: "#525252", to: "#0a0a0a" },
  { id: "candy", name: "Candy", from: "#ec4899", to: "#500f28" },
];

export function memeStyle(id: string): MemeStyle {
  return MEME_STYLES.find((style) => style.id === id) ?? MEME_STYLES[0]!;
}

export function normalizeCaption(text: string, upper: boolean): string {
  const cleaned = text.replace(/\r/g, "").trim();
  return upper ? cleaned.toUpperCase() : cleaned;
}

export function splitCaptionLines(text: string): string[] {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return lines.length > 0 ? lines : [""];
}

/** Base font size scales with image width; scale is the user's 50–150% control. */
export function captionFontPx(width: number, scale: number): number {
  return Math.max(16, Math.round(width * 0.085 * scale));
}

export const CAPTION_PAD_RATIO = 0.04;

/** Y of the top caption block's first baseline area, including drag offset. */
export function topCaptionY(height: number, offsetY: number): number {
  return Math.round(height * CAPTION_PAD_RATIO + offsetY);
}

/** Y of the bottom caption block's top edge, including drag offset. */
export function bottomCaptionY(height: number, blockHeight: number, offsetY: number): number {
  return Math.round(height - height * CAPTION_PAD_RATIO - blockHeight + offsetY);
}

export function clampOffset(offset: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, offset));
}

/** Vertical drag bounds for a caption block so it cannot leave the image. */
export function captionDragBounds(height: number, blockHeight: number): { min: number; max: number } {
  const pad = height * CAPTION_PAD_RATIO;
  return { min: -(height - blockHeight - pad * 2), max: height - blockHeight - pad * 2 };
}

export function memeFileName(when: Date = new Date()): string {
  return `meme-${when.getTime().toString(36)}.png`;
}

export function isImageMime(mime: string): boolean {
  return mime.toLowerCase().startsWith("image/");
}
