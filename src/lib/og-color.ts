/** Paper and ink for the default Open Graph card. No brand cobalt. */
export const OG_PAPER = { l: 0.989, c: 0.0015, h: 250 } as const;
export const OG_INK = { l: 0.2, c: 0.012, h: 265 } as const;
export const OG_RULE = { l: 0.9, c: 0.004, h: 255 } as const;

export function oklchToRgb(l: number, c: number, h: number): { r: number; g: number; b: number } {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;
  const r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bl = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;
  const lin = (v: number) => {
    const x = Math.min(1, Math.max(0, v));
    return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
  };
  return {
    r: Math.round(lin(r) * 255),
    g: Math.round(lin(g) * 255),
    b: Math.round(lin(bl) * 255),
  };
}
