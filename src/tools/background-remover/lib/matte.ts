export type Rgb = { r: number; g: number; b: number };

export function parseHexColor(value: string): Rgb | null {
  const hex = value.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const full = hex.length === 3 ? [...hex].map((char) => char + char).join("") : hex;
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

export function hexColor(color: Rgb) {
  const part = (channel: number) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0");
  return `#${part(color.r)}${part(color.g)}${part(color.b)}`;
}

export type MatteOptions = {
  tolerance: number;
  feather: boolean;
  color: Rgb | null;
};

const MAX_EDGE = 4096;

export function sampleCornerColor(pixels: Uint8Array, width: number, height: number): Rgb {
  const reach = Math.max(1, Math.min(3, Math.floor(Math.min(width, height) / 8) || 1));
  const corners: Array<[number, number]> = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (const [cx, cy] of corners) {
    for (let y = Math.max(0, cy - reach + 1); y <= Math.min(height - 1, cy); y += 1) {
      for (let x = Math.max(0, cx - reach + 1); x <= Math.min(width - 1, cx); x += 1) {
        const index = (y * width + x) * 4;
        r += pixels[index] ?? 0;
        g += pixels[index + 1] ?? 0;
        b += pixels[index + 2] ?? 0;
        count += 1;
      }
    }
  }
  if (count === 0) return { r: 255, g: 255, b: 255 };
  return { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
}

function distance(pixels: Uint8Array, index: number, color: Rgb) {
  const dr = (pixels[index] ?? 0) - color.r;
  const dg = (pixels[index + 1] ?? 0) - color.g;
  const db = (pixels[index + 2] ?? 0) - color.b;
  return Math.hypot(dr, dg, db);
}

export function removeSolidBackground(pixels: Uint8Array, width: number, height: number, options: MatteOptions): Uint8Array {
  if (width < 1 || height < 1 || width > MAX_EDGE || height > MAX_EDGE) {
    throw new Error("The image must be between 1 and 4096 pixels on a side.");
  }
  if (pixels.length < width * height * 4) throw new Error("The image pixels are incomplete.");
  const out = new Uint8Array(pixels);
  const tolerance = Math.min(180, Math.max(0, options.tolerance));
  const color = options.color ?? sampleCornerColor(pixels, width, height);
  const background = new Uint8Array(width * height);
  const queue: number[] = [];
  const push = (x: number, y: number) => {
    const pixel = y * width + x;
    if (background[pixel]) return;
    if (distance(pixels, pixel * 4, color) > tolerance) return;
    background[pixel] = 1;
    queue.push(pixel);
  };
  for (let x = 0; x < width; x += 1) {
    push(x, 0);
    if (height > 1) push(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    push(0, y);
    if (width > 1) push(width - 1, y);
  }
  for (let head = 0; head < queue.length; head += 1) {
    const pixel = queue[head] ?? 0;
    const x = pixel % width;
    const y = (pixel - x) / width;
    if (x > 0) push(x - 1, y);
    if (x + 1 < width) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y + 1 < height) push(x, y + 1);
  }
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = y * width + x;
      const index = pixel * 4;
      const existing = out[index + 3] ?? 255;
      if (background[pixel]) {
        out[index + 3] = 0;
        continue;
      }
      if (!options.feather) continue;
      let near = false;
      for (let oy = -1; oy <= 1 && !near; oy += 1) {
        const yy = y + oy;
        if (yy < 0 || yy >= height) continue;
        for (let ox = -1; ox <= 1; ox += 1) {
          const xx = x + ox;
          if (xx < 0 || xx >= width) continue;
          if (background[yy * width + xx]) {
            near = true;
            break;
          }
        }
      }
      if (!near || tolerance <= 0) continue;
      const closeness = Math.min(1, distance(pixels, index, color) / (tolerance * 1.6));
      out[index + 3] = Math.round(existing * closeness);
    }
  }
  return out;
}
