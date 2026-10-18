import { readFile } from "node:fs/promises";
import path from "node:path";
import { createElement as h, type ReactNode } from "react";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { memeStyle, splitCaptionLines } from "./meme";

// Node-only: imported by mcp.ts. Never import from tool.tsx.

type MemeFont = { name: string; data: ArrayBuffer; weight: 700; style: "normal" };

let fontsPromise: Promise<MemeFont[]> | null = null;

function loadMemeFonts(): Promise<MemeFont[]> {
  fontsPromise ??= (async () => {
    const data = await readFile(path.join(process.cwd(), "public/fonts/og/Geist-Bold.ttf"));
    return [
      {
        name: "Geist",
        data: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer,
        weight: 700,
        style: "normal" as const,
      },
    ];
  })();
  return fontsPromise;
}

const OUTLINE_OFFSETS: Array<[number, number]> = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
];

function strokedCaption(lines: string[], fontPx: number): ReactNode {
  const spread = Math.max(1, Math.round(fontPx / 22));
  const lineNodes = lines.map((line, index) => h("div", { key: index }, line));
  const outline = OUTLINE_OFFSETS.map(([dx, dy], index) =>
    h(
      "div",
      {
        key: `o${index}`,
        style: {
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          color: "#000000",
          transform: `translate(${dx * spread}px, ${dy * spread}px)`,
        },
      },
      ...lineNodes,
    ),
  );
  return h(
    "div",
    {
      style: {
        position: "relative",
        fontSize: fontPx,
        fontWeight: 700,
        lineHeight: 1.15,
        textAlign: "center",
        color: "#ffffff",
        width: "100%",
      },
    },
    ...outline,
    h("div", { style: { position: "relative" } }, ...lineNodes),
  );
}

export type MemeRenderInput = {
  imageDataUri?: string;
  imageWidth?: number;
  imageHeight?: number;
  styleId?: string;
  top: string;
  bottom: string;
  fontScale?: number;
};

export async function renderMemePng(input: MemeRenderInput): Promise<{ png: Buffer; width: number; height: number }> {
  const fonts = await loadMemeFonts();
  const style = memeStyle(input.styleId ?? "");
  const width = input.imageDataUri && input.imageWidth ? input.imageWidth : 1080;
  const height = input.imageDataUri && input.imageHeight ? input.imageHeight : 1080;
  const fontPx = Math.max(20, Math.round(width * 0.085 * (input.fontScale ?? 1)));
  const top = splitCaptionLines(input.top);
  const bottom = splitCaptionLines(input.bottom);
  const pad = Math.round(width * 0.04);

  const background = input.imageDataUri
    ? h("img", {
        src: input.imageDataUri,
        style: { position: "absolute", left: 0, top: 0, width: "100%", height: "100%" },
      })
    : h("div", {
        style: {
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          background: `linear-gradient(135deg, ${style.from}, ${style.to})`,
        },
      });

  const element = h(
    "div",
    { style: { display: "flex", width, height, position: "relative", fontFamily: "Geist" } },
    background,
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: pad,
        },
      },
      h("div", { style: { display: "flex", justifyContent: "center" } }, strokedCaption(top, fontPx)),
      h("div", { style: { display: "flex", justifyContent: "center" } }, strokedCaption(bottom, fontPx)),
    ),
  );

  const svg = await satori(element, { width, height, fonts });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng();
  return { png: Buffer.from(png), width, height };
}
