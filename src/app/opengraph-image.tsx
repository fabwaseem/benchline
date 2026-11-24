import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";
import { tools } from "@/registry";

export const alt = `${SITE_NAME}: free browser tools for web work`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FOREST = "#0A0A0A";
const LIME = "#C6F19D";
const INK = "#EDEDED";
const MUTED = "#A1A1A1";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: FOREST,
          backgroundImage: "radial-gradient(circle at 82% 22%, rgba(198,241,157,0.18), rgba(10,10,10,0) 55%)",
          color: INK,
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="44" height="44" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="8" fill={LIME} />
            <rect x="6" y="20" width="20" height="3" rx="1.5" fill={FOREST} />
            <rect x="16.5" y="9.5" width="8" height="8" rx="2" fill={FOREST} />
            <rect x="8.5" y="13.5" width="5" height="4" rx="1.25" fill={FOREST} opacity="0.55" />
          </svg>
          <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: -1.2 }}>benchline</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 76, fontWeight: 600, letterSpacing: -3, lineHeight: 1 }}>{`${tools.length} browser tools for web work.`}</div>
          <div style={{ fontSize: 34, letterSpacing: -0.8, color: MUTED }}>PDF, images, JSON, security, SEO. Free, and callable over MCP.</div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {["Runs in your browser", "No signup", "MCP ready"].map((label) => (
            <div key={label} style={{ display: "flex", padding: "10px 18px", borderRadius: 999, border: `1px solid rgba(198,241,157,0.35)`, color: LIME, fontSize: 22 }}>
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
