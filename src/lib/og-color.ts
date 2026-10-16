function channel(value: number) {
  const clamped = Math.min(1, Math.max(0, value));
  const encoded = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
  return Math.round(encoded * 255);
}

export function oklchToRgb(lightness: number, chroma: number, hue: number) {
  const a = chroma * Math.cos((hue * Math.PI) / 180);
  const b = chroma * Math.sin((hue * Math.PI) / 180);
  const l_ = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = lightness - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const red = channel(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const green = channel(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const blue = channel(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
  return `rgb(${red} ${green} ${blue})`;
}

export const ogColors = {
  paper: oklchToRgb(0.985, 0.004, 95),
  ink: oklchToRgb(0.22, 0.02, 260),
  cobalt: oklchToRgb(0.55, 0.2, 262),
  muted: oklchToRgb(0.45, 0.02, 260),
};
