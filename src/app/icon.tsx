import { ImageResponse } from "next/og";
import { ogColors } from "@/lib/og-color";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: ogColors.cobalt,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "flex-end",
        }}
      >
        <div style={{ width: 10, height: 10, background: ogColors.paper }} />
      </div>
    ),
    { ...size },
  );
}
