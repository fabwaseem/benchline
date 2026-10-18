import { converter, differenceEuclidean, formatHex, formatHsl, formatRgb, nearest, parse, wcagContrast, type CuloriColor } from "culori";
import { tailwindPalette } from "@/tools/color-converter/lib/palette";

const toRgb = converter("rgb");
const toOklch = converter("oklch");

const AA_NORMAL = 4.5;
const AA_LARGE = 3;
const AAA_NORMAL = 7;
const AAA_LARGE = 4.5;

const paletteValues = tailwindPalette.map((token) => token.value);
const closest = nearest(paletteValues, differenceEuclidean("oklab"));

export type ColorParts = {
  hex: string;
  rgb: string;
  hsl: string;
  oklch: string;
  cmyk: string;
  tailwind: string;
};

export type ContrastReport = {
  ratio: number;
  ratioText: string;
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  aaaLarge: boolean;
  foreground: string;
  background: string;
};

function channelPercent(value: number): string {
  const pct = Math.round(value * 1000) / 10;
  return Number.isInteger(pct) ? String(pct) : pct.toFixed(1);
}

function cmykFromBytes(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const k = 1 - Math.max(rf, gf, bf);
  if (k >= 1 - 1e-8) return { c: 0, m: 0, y: 0, k: 1 };
  return {
    c: (1 - rf - k) / (1 - k),
    m: (1 - gf - k) / (1 - k),
    y: (1 - bf - k) / (1 - k),
    k,
  };
}

function formatCmyk(r: number, g: number, b: number): string {
  const ink = cmykFromBytes(r, g, b);
  return `cmyk(${channelPercent(ink.c)}%, ${channelPercent(ink.m)}%, ${channelPercent(ink.y)}%, ${channelPercent(ink.k)}%)`;
}

function formatOklch(color: CuloriColor): string {
  const l = ((color.l ?? 0) * 100).toFixed(2);
  const c = (color.c ?? 0).toFixed(4);
  const h = (color.h ?? 0).toFixed(2);
  return `oklch(${l}% ${c} ${h})`;
}

function bytesFromColor(color: CuloriColor): { r: number; g: number; b: number } | null {
  const rgb = toRgb(color);
  if (!rgb || rgb.r === undefined || rgb.g === undefined || rgb.b === undefined) return null;
  return {
    r: Math.round(Math.min(1, Math.max(0, rgb.r)) * 255),
    g: Math.round(Math.min(1, Math.max(0, rgb.g)) * 255),
    b: Math.round(Math.min(1, Math.max(0, rgb.b)) * 255),
  };
}

function hexFromCmyk(input: string): string | null {
  const match = input
    .trim()
    .match(/^cmyk\(\s*([0-9.]+)\s*%?\s*[, ]\s*([0-9.]+)\s*%?\s*[, ]\s*([0-9.]+)\s*%?\s*[, ]\s*([0-9.]+)\s*%?\s*\)$/i);
  if (!match) return null;
  const raw = [match[1], match[2], match[3], match[4]].map((part) => Number(part));
  if (raw.some((part) => !Number.isFinite(part))) return null;
  const percent = input.includes("%") || raw.some((part) => part > 1);
  const [c, m, y, k] = raw.map((part) => Math.min(1, Math.max(0, percent ? part / 100 : part)));
  const r = Math.round(255 * (1 - (c ?? 0)) * (1 - (k ?? 0)));
  const g = Math.round(255 * (1 - (m ?? 0)) * (1 - (k ?? 0)));
  const b = Math.round(255 * (1 - (y ?? 0)) * (1 - (k ?? 0)));
  return `#${[r, g, b].map((part) => part.toString(16).padStart(2, "0")).join("")}`;
}

export function parseColor(input: string): CuloriColor | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const fromCmyk = hexFromCmyk(trimmed);
  const color = parse(fromCmyk ?? trimmed);
  if (!color) return null;
  return color;
}

export function convertColor(input: string): ColorParts | null {
  const color = parseColor(input);
  if (!color) return null;
  const bytes = bytesFromColor(color);
  const oklch = toOklch(color);
  const hex = formatHex(color);
  const rgb = formatRgb(color);
  const hsl = formatHsl(color);
  if (!bytes || !oklch || !hex || !rgb || !hsl) return null;
  const match = closest(hex, 1)[0];
  const token = tailwindPalette.find((item) => item.value === match);
  return {
    hex,
    rgb,
    hsl,
    oklch: formatOklch(oklch),
    cmyk: formatCmyk(bytes.r, bytes.g, bytes.b),
    tailwind: token?.name ?? "",
  };
}

export function flattenOver(foreground: string, background: string): string | null {
  const fg = parseColor(foreground);
  const bg = parseColor(background);
  if (!fg || !bg) return null;
  const fgRgb = toRgb(fg);
  const bgRgb = toRgb(bg);
  if (!fgRgb || !bgRgb) return null;
  const alpha = fg.alpha ?? 1;
  const mix = (fore: number | undefined, back: number | undefined) => (fore ?? 0) * alpha + (back ?? 0) * (1 - alpha);
  const r = Math.round(Math.min(1, Math.max(0, mix(fgRgb.r, bgRgb.r))) * 255);
  const g = Math.round(Math.min(1, Math.max(0, mix(fgRgb.g, bgRgb.g))) * 255);
  const b = Math.round(Math.min(1, Math.max(0, mix(fgRgb.b, bgRgb.b))) * 255);
  return `#${[r, g, b].map((part) => part.toString(16).padStart(2, "0")).join("")}`;
}

function passes(ratio: number, threshold: number): boolean {
  return ratio + 1e-9 >= threshold;
}

export function formatRatio(ratio: number): string {
  if (!Number.isFinite(ratio)) return "0:1";
  if (ratio >= 20.995) return "21:1";
  return `${ratio.toFixed(2)}:1`;
}

export function contrastPair(foreground: string, background: string): ContrastReport | null {
  const flat = flattenOver(foreground, background);
  const back = formatHex(parseColor(background) ?? undefined);
  if (!flat || !back) return null;
  const ratio = wcagContrast(flat, back);
  if (!Number.isFinite(ratio)) return null;
  return {
    ratio,
    ratioText: formatRatio(ratio),
    aaNormal: passes(ratio, AA_NORMAL),
    aaLarge: passes(ratio, AA_LARGE),
    aaaNormal: passes(ratio, AAA_NORMAL),
    aaaLarge: passes(ratio, AAA_LARGE),
    foreground: flat,
    background: back,
  };
}
