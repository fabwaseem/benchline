import { readFile } from "node:fs/promises";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import type { ReactNode } from "react";
import { OG_FONT_FILES, type OgFont } from "@/tools/og-image-generator/lib/fonts";

let fontsPromise: Promise<OgFont[]> | null = null;

function loadFonts() {
  fontsPromise ??= Promise.all(OG_FONT_FILES.map(async (font) => {
    const data = await readFile(path.join(process.cwd(), "public/fonts/og", font.file));
    return {
      name: font.name,
      data: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer,
      weight: font.weight,
      style: font.style,
    };
  }));
  return fontsPromise;
}

export async function renderOgPng(element: ReactNode, width: number, height: number) {
  const fonts = await loadFonts();
  const svg = await satori(element, { width, height, fonts });
  return new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng();
}
