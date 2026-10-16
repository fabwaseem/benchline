import { ImageResponse } from "next/og";
import { OG_INK, OG_PAPER, OG_RULE, oklchToRgb } from "@/lib/og-color";
import { SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} — a quiet bench for exact work`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function rgb({ r, g, b }: { r: number; g: number; b: number }) {
  return `rgb(${r}, ${g}, ${b})`;
}

export default function OpenGraphImage() {
  const paper = rgb(oklchToRgb(OG_PAPER.l, OG_PAPER.c, OG_PAPER.h));
  const ink = rgb(oklchToRgb(OG_INK.l, OG_INK.c, OG_INK.h));
  const rule = rgb(oklchToRgb(OG_RULE.l, OG_RULE.c, OG_RULE.h));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: paper,
          color: ink,
          padding: 72,
          fontFamily: "Geist, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgb(196, 92, 42)" }} />
          <div style={{ fontSize: 28, letterSpacing: -0.6 }}>{SITE_NAME.toLowerCase()}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 76, letterSpacing: -2.4, lineHeight: 0.95 }}>A quiet bench</div>
          <div style={{ fontSize: 76, letterSpacing: -2.4, lineHeight: 0.95, color: "rgb(120, 124, 132)" }}>
            for exact work.
          </div>
        </div>
        <div style={{ height: 1, background: rule }} />
      </div>
    ),
    size,
  );
}
