import { ImageResponse } from "next/og";
import { ogColors } from "@/lib/og-color";

export const alt = "Toolsmith — a quiet bench for exact work";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: ogColors.paper,
          color: ogColors.ink,
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 28, height: 28, background: ogColors.cobalt, display: "flex" }} />
          <div style={{ fontSize: 22, letterSpacing: 4, textTransform: "uppercase", color: ogColors.cobalt }}>
            Toolsmith
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 72, fontWeight: 600, lineHeight: 1, letterSpacing: -2 }}>
            A quiet bench for exact work.
          </div>
          <div style={{ marginTop: 24, fontSize: 28, color: ogColors.muted }}>
            AI search, previews, tokens, and Next.js deploy files.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
