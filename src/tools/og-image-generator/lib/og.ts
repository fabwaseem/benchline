export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export const templates = ["blog", "product", "minimal", "gradient", "code", "profile"] as const;
export type OgTemplate = (typeof templates)[number];

export type OgInput = {
  template: OgTemplate;
  title: string;
  subtitle: string;
  author: string;
  background: string;
  foreground: string;
  accent: string;
  font: "sans" | "mono";
};

export const ogExample: OgInput = {
  template: "blog",
  title: "Ship the note people actually share",
  subtitle: "A 1200×630 card with a title you can still read in the preview.",
  author: "Waseem Anjum",
  background: "oklch(0.22 0.02 260)",
  foreground: "oklch(0.96 0.005 95)",
  accent: "oklch(0.68 0.16 262)",
  font: "sans",
};

export function buildMetaTags(input: OgInput, imageUrl = "https://example.com/opengraph-image") {
  return [
    `<meta property="og:title" content="${escapeAttr(input.title)}" />`,
    `<meta property="og:description" content="${escapeAttr(input.subtitle)}" />`,
    `<meta property="og:image" content="${escapeAttr(imageUrl)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(input.title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(input.subtitle)}" />`,
    `<meta name="twitter:image" content="${escapeAttr(imageUrl)}" />`,
  ].join("\n");
}

export function buildOpenGraphFile(input: OgInput) {
  const family = input.font === "mono" ? "Geist Mono" : "Geist";
  return `import { ImageResponse } from "next/og";

export const alt = ${JSON.stringify(input.title)};
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
          justifyContent: "flex-end",
          background: ${JSON.stringify(input.background)},
          color: ${JSON.stringify(input.foreground)},
          fontFamily: ${JSON.stringify(family)},
          padding: "64px",
        }}
      >
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: ${JSON.stringify(input.accent)} }}>
          ${JSON.stringify(input.template.toUpperCase())}
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 68, fontWeight: 650, lineHeight: 1.02, letterSpacing: -2 }}>
          ${JSON.stringify(input.title)}
        </div>
        <div style={{ display: "flex", marginTop: 18, fontSize: 28, opacity: 0.78 }}>
          ${JSON.stringify(input.subtitle)}
        </div>
      </div>
    ),
    { ...size },
  );
}
`;
}

function escapeAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
