import { ImageResponse } from "next/og";
import { ogColors } from "@/lib/og-color";
import { getTool } from "@/registry";

export const alt = "Toolsmith instrument";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  const name = tool?.name ?? "Toolsmith";
  const tagline = tool?.tagline ?? "A precise instrument.";
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
          <div
            style={{
              width: 28,
              height: 28,
              background: ogColors.cobalt,
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: ogColors.cobalt,
            }}
          >
            Toolsmith
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 68, fontWeight: 600, lineHeight: 1.05, letterSpacing: -1 }}>{name}</div>
          <div style={{ marginTop: 20, fontSize: 28, color: ogColors.muted, maxWidth: 980 }}>{tagline}</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
