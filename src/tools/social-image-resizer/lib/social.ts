export const SOCIAL_PRESETS = [
  { id: "instagram-post", label: "Instagram post", width: 1080, height: 1080 },
  { id: "instagram-portrait", label: "Instagram portrait", width: 1080, height: 1350 },
  { id: "instagram-story", label: "Instagram story", width: 1080, height: 1920 },
  { id: "youtube-thumbnail", label: "YouTube thumbnail", width: 1280, height: 720 },
  { id: "x-post", label: "X post", width: 1200, height: 675 },
  { id: "x-header", label: "X header", width: 1500, height: 500 },
  { id: "linkedin-post", label: "LinkedIn post", width: 1200, height: 627 },
  { id: "facebook-post", label: "Facebook post", width: 1200, height: 630 },
] as const;

export type SocialPresetId = (typeof SOCIAL_PRESETS)[number]["id"];

export type SocialPreset = (typeof SOCIAL_PRESETS)[number];

export function presetById(id: string): SocialPreset | undefined {
  return SOCIAL_PRESETS.find((preset) => preset.id === id);
}

export type CropRect = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(1, Math.max(0, value));
}

function positive(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive number.`);
  }
  return value;
}

/**
 * Cover-fit crop rectangle inside the source image for the destination frame.
 * The focal point (0..1, clamped) pins the visible subject: 0.5 keeps it
 * centered, 0 keeps the start edge, 1 keeps the end edge.
 */
export function coverCrop(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  focalX = 0.5,
  focalY = 0.5,
): CropRect {
  positive(srcW, "Source width");
  positive(srcH, "Source height");
  positive(dstW, "Target width");
  positive(dstH, "Target height");
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const cropW = dstW / scale;
  const cropH = dstH / scale;
  const sw = Math.min(srcW, Math.max(1, Math.round(cropW)));
  const sh = Math.min(srcH, Math.max(1, Math.round(cropH)));
  const fx = clamp01(focalX);
  const fy = clamp01(focalY);
  const sx = Math.min(Math.max(0, Math.round((srcW - sw) * fx)), Math.max(0, srcW - sw));
  const sy = Math.min(Math.max(0, Math.round((srcH - sh) * fy)), Math.max(0, srcH - sh));
  return { sx, sy, sw, sh };
}
