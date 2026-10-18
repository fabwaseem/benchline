export const cropUnits = ["px", "ratio"] as const;
export type CropUnit = (typeof cropUnits)[number];

export const cropFormats = ["png", "jpeg", "webp"] as const;
export type CropFormat = (typeof cropFormats)[number];

export type CropBox = { x: number; y: number; width: number; height: number };

export const aspectPresets = [
  { id: "free", label: "Free", ratio: null },
  { id: "1:1", label: "1:1", ratio: 1 },
  { id: "4:5", label: "4:5", ratio: 4 / 5 },
  { id: "3:2", label: "3:2", ratio: 3 / 2 },
  { id: "16:9", label: "16:9", ratio: 16 / 9 },
  { id: "9:16", label: "9:16", ratio: 9 / 16 },
  { id: "og", label: "Open Graph", ratio: 1200 / 630 },
] as const;

export type AspectPreset = (typeof aspectPresets)[number]["id"];

export function aspectRatio(id: AspectPreset): number | undefined {
  const preset = aspectPresets.find((item) => item.id === id);
  return preset?.ratio ?? undefined;
}

export function clampCrop(sourceWidth: number, sourceHeight: number, box: CropBox, unit: CropUnit): CropBox {
  const sw = Math.max(1, Math.round(Number.isFinite(sourceWidth) ? sourceWidth : 1));
  const sh = Math.max(1, Math.round(Number.isFinite(sourceHeight) ? sourceHeight : 1));
  const scaleX = unit === "ratio" ? sw : 1;
  const scaleY = unit === "ratio" ? sh : 1;
  let x = Math.round((Number.isFinite(box.x) ? box.x : 0) * scaleX);
  let y = Math.round((Number.isFinite(box.y) ? box.y : 0) * scaleY);
  let width = Math.round((Number.isFinite(box.width) ? box.width : sw) * scaleX);
  let height = Math.round((Number.isFinite(box.height) ? box.height : sh) * scaleY);
  if (width < 1) width = 1;
  if (height < 1) height = 1;
  if (x < 0) x = 0;
  if (y < 0) y = 0;
  if (x > sw - 1) x = sw - 1;
  if (y > sh - 1) y = sh - 1;
  if (x + width > sw) width = sw - x;
  if (y + height > sh) height = sh - y;
  return { x, y, width: Math.max(1, width), height: Math.max(1, height) };
}
