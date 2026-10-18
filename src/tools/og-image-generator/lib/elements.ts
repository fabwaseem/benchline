import { createElement, type CSSProperties, type ReactNode } from "react";

export function flex(style: CSSProperties, ...children: ReactNode[]) {
  return createElement("div", { style: { display: "flex", boxSizing: "border-box", ...style } }, ...children);
}

export function text(value: string, style: CSSProperties) {
  return flex(style, value);
}

export function photo(src: string, style: CSSProperties) {
  return createElement("img", { alt: "", src, style: { objectFit: "cover", ...style } });
}

export function px(cardWidth: number, value: number) {
  return Math.max(1, Math.round(value * (cardWidth / 1200)));
}

export function linesOf(value: string, limit = 8) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, limit);
}
