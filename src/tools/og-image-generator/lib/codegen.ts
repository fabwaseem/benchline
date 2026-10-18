import { isValidElement, type CSSProperties, type ReactNode } from "react";
import type { OgSizeId } from "@/tools/og-image-generator/lib/types";
import { OG_SIZES } from "@/tools/og-image-generator/lib/types";

const FONT_URLS = {
  "Geist-Regular.ttf": "https://cdn.jsdelivr.net/npm/geist@1.7.0/dist/fonts/geist-sans/Geist-Regular.ttf",
  "Geist-Medium.ttf": "https://cdn.jsdelivr.net/npm/geist@1.7.0/dist/fonts/geist-sans/Geist-Medium.ttf",
  "Geist-SemiBold.ttf": "https://cdn.jsdelivr.net/npm/geist@1.7.0/dist/fonts/geist-sans/Geist-SemiBold.ttf",
  "Geist-Bold.ttf": "https://cdn.jsdelivr.net/npm/geist@1.7.0/dist/fonts/geist-sans/Geist-Bold.ttf",
  "GeistMono-Regular.ttf": "https://cdn.jsdelivr.net/npm/geist@1.7.0/dist/fonts/geist-mono/GeistMono-Regular.ttf",
  "GeistMono-Medium.ttf": "https://cdn.jsdelivr.net/npm/geist@1.7.0/dist/fonts/geist-mono/GeistMono-Medium.ttf",
  "InstrumentSerif-Regular.ttf": "https://github.com/google/fonts/raw/main/ofl/instrumentserif/InstrumentSerif-Regular.ttf",
  "InstrumentSerif-Italic.ttf": "https://github.com/google/fonts/raw/main/ofl/instrumentserif/InstrumentSerif-Italic.ttf",
} as const;

export function buildOpenGraphFile(element: ReactNode, alt: string, sizeId: OgSizeId) {
  const size = OG_SIZES[sizeId];
  const body = serialize(element, 6);
  return `import { ImageResponse } from "next/og";

export const alt = ${JSON.stringify(alt)};
export const size = { width: ${size.width}, height: ${size.height} };
export const contentType = "image/png";

export default async function Image() {
  const load = (url: string) => fetch(url).then((res) => res.arrayBuffer());
  const [regular, medium, semibold, bold, mono, monoMedium, serif, serifItalic] = await Promise.all([
    load(${JSON.stringify(FONT_URLS["Geist-Regular.ttf"])}),
    load(${JSON.stringify(FONT_URLS["Geist-Medium.ttf"])}),
    load(${JSON.stringify(FONT_URLS["Geist-SemiBold.ttf"])}),
    load(${JSON.stringify(FONT_URLS["Geist-Bold.ttf"])}),
    load(${JSON.stringify(FONT_URLS["GeistMono-Regular.ttf"])}),
    load(${JSON.stringify(FONT_URLS["GeistMono-Medium.ttf"])}),
    load(${JSON.stringify(FONT_URLS["InstrumentSerif-Regular.ttf"])}),
    load(${JSON.stringify(FONT_URLS["InstrumentSerif-Italic.ttf"])}),
  ]);
  return new ImageResponse(
    (
${body}
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: regular, weight: 400, style: "normal" },
        { name: "Geist", data: medium, weight: 500, style: "normal" },
        { name: "Geist", data: semibold, weight: 600, style: "normal" },
        { name: "Geist", data: bold, weight: 700, style: "normal" },
        { name: "Geist Mono", data: mono, weight: 400, style: "normal" },
        { name: "Geist Mono", data: monoMedium, weight: 500, style: "normal" },
        { name: "Instrument Serif", data: serif, weight: 400, style: "normal" },
        { name: "Instrument Serif", data: serifItalic, weight: 400, style: "italic" },
      ],
    },
  );
}
`;
}

export function buildMetaTags(input: { title: string; subtitle: string }, sizeId: OgSizeId = "1200x630", imageUrl = "https://example.com/opengraph-image") {
  const size = OG_SIZES[sizeId];
  return [
    `<meta property="og:title" content="${escapeAttr(input.title)}" />`,
    `<meta property="og:description" content="${escapeAttr(input.subtitle)}" />`,
    `<meta property="og:image" content="${escapeAttr(imageUrl)}" />`,
    `<meta property="og:image:width" content="${size.width}" />`,
    `<meta property="og:image:height" content="${size.height}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(input.title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(input.subtitle)}" />`,
    `<meta name="twitter:image" content="${escapeAttr(imageUrl)}" />`,
  ].join("\n");
}

function escapeAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function serialize(node: ReactNode, pad: number): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return `${" ".repeat(pad)}{${JSON.stringify(String(node))}}`;
  if (Array.isArray(node)) return node.map((child) => serialize(child, pad)).filter(Boolean).join("\n");
  if (!isValidElement(node)) return "";
  const type = typeof node.type === "string" ? node.type : "div";
  const props = node.props as { style?: CSSProperties; children?: ReactNode; src?: string; alt?: string };
  const attrs: string[] = [];
  if (props.src) attrs.push(`src=${JSON.stringify(props.src)}`);
  if (type === "img") attrs.push(`alt=${JSON.stringify(props.alt ?? "")}`);
  if (props.style) attrs.push(`style={${styleLiteral(props.style)}}`);
  const open = `${" ".repeat(pad)}<${type}${attrs.length ? " " : ""}${attrs.join(" ")}`;
  const children = serialize(props.children, pad + 2);
  if (!children) return `${open} />`;
  return `${open}>\n${children}\n${" ".repeat(pad)}</${type}>`;
}

function styleLiteral(style: CSSProperties) {
  const entries = Object.entries(style).filter(([, value]) => value !== undefined && value !== null);
  return `{ ${entries.map(([key, value]) => `${key}: ${typeof value === "number" ? value : JSON.stringify(value)}`).join(", ")} }`;
}
