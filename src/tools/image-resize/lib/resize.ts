export const fitModes = ["contain", "cover", "stretch"] as const;
export const resizeModes = ["pixels", "percent"] as const;

export type FitMode = (typeof fitModes)[number];
export type ResizeMode = (typeof resizeModes)[number];

export const MAX_EDGE = 8192;

export const resizePresets = [
  { id: "ig-square", label: "Instagram square", width: 1080, height: 1080 },
  { id: "ig-portrait", label: "Instagram portrait", width: 1080, height: 1350 },
  { id: "story", label: "Story", width: 1080, height: 1920 },
  { id: "og", label: "Open Graph", width: 1200, height: 630 },
  { id: "hd", label: "HD", width: 1920, height: 1080 },
  { id: "thumb", label: "Thumbnail", width: 320, height: 320 },
] as const;

export type Placement = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
};

export type ResizeRequest = {
  sourceWidth: number;
  sourceHeight: number;
  mode: ResizeMode;
  width: number | null;
  height: number | null;
  percent: number;
  lockAspect: boolean;
};

function finite(value: number | null): number | null {
  if (value === null || !Number.isFinite(value) || value <= 0) return null;
  return Math.min(MAX_EDGE, Math.max(1, Math.round(value)));
}

export function planResize(input: ResizeRequest): { width: number; height: number } {
  const sw = Math.max(1, Math.round(Number.isFinite(input.sourceWidth) ? input.sourceWidth : 1));
  const sh = Math.max(1, Math.round(Number.isFinite(input.sourceHeight) ? input.sourceHeight : 1));
  if (input.mode === "percent") {
    const percent = Math.min(400, Math.max(1, Number.isFinite(input.percent) ? input.percent : 100));
    const scale = percent / 100;
    return {
      width: Math.max(1, Math.min(MAX_EDGE, Math.round(sw * scale))),
      height: Math.max(1, Math.min(MAX_EDGE, Math.round(sh * scale))),
    };
  }
  let width = finite(input.width);
  let height = finite(input.height);
  if (input.lockAspect) {
    if (width && !height) height = Math.max(1, Math.min(MAX_EDGE, Math.round((sh * width) / sw)));
    else if (height && !width) width = Math.max(1, Math.min(MAX_EDGE, Math.round((sw * height) / sh)));
  }
  return { width: width ?? sw, height: height ?? sh };
}

export function placement(sourceWidth: number, sourceHeight: number, destWidth: number, destHeight: number, fit: FitMode): Placement {
  const sw = Math.max(1, sourceWidth);
  const sh = Math.max(1, sourceHeight);
  const dw = Math.max(1, destWidth);
  const dh = Math.max(1, destHeight);
  if (fit === "stretch") {
    return { sx: 0, sy: 0, sw, sh, dx: 0, dy: 0, dw, dh };
  }
  const scale = fit === "cover" ? Math.max(dw / sw, dh / sh) : Math.min(dw / sw, dh / sh);
  if (fit === "contain") {
    const drawnW = sw * scale;
    const drawnH = sh * scale;
    return { sx: 0, sy: 0, sw, sh, dx: (dw - drawnW) / 2, dy: (dh - drawnH) / 2, dw: drawnW, dh: drawnH };
  }
  const cropW = dw / scale;
  const cropH = dh / scale;
  return { sx: (sw - cropW) / 2, sy: (sh - cropH) / 2, sw: cropW, sh: cropH, dx: 0, dy: 0, dw, dh };
}

export function parseDimension(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const number = Number(trimmed);
  if (!Number.isFinite(number) || number <= 0) return null;
  return Math.round(number);
}
