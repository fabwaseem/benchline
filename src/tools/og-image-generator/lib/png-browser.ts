import type { ReactNode } from "react";
import { OG_FONT_FILES, type OgFont } from "@/tools/og-image-generator/lib/fonts";

let fontsPromise: Promise<OgFont[]> | null = null;

function loadFonts() {
  fontsPromise ??= Promise.all(OG_FONT_FILES.map(async (font) => {
    const response = await fetch(`/fonts/og/${font.file}`);
    if (!response.ok) throw new Error("Could not load the card fonts.");
    return {
      name: font.name,
      data: await response.arrayBuffer(),
      weight: font.weight,
      style: font.style,
    };
  }));
  return fontsPromise;
}

export async function rasterizeCard(element: ReactNode, width: number, height: number) {
  const satori = (await import("satori")).default;
  const svg = await satori(element, { width, height, fonts: await loadFonts() });
  return svgToPng(svg, width, height);
}

function svgToPng(svg: string, width: number, height: number) {
  return new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Could not draw the card."));
        return;
      }
      ctx.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not rasterize the card."));
    };
    image.src = url;
  });
}
