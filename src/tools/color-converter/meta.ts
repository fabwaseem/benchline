import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "color-converter",
  name: "Color converter",
  tagline: "Turn any color into HEX, RGB, HSL, OKLCH, and CMYK, and check the contrast ratio.",
  description:
    "Free color converter and contrast checker. Paste HEX, RGB, HSL, OKLCH, CMYK, or a CSS color name and read every format back. The contrast ratio uses WCAG 2, with AA and AAA flags for normal and large text, plus the nearest Tailwind token.",
  category: "design",
  tags: ["color", "contrast", "wcag", "oklch"],
  keywords: ["hex to rgb", "contrast checker", "oklch converter", "cmyk converter", "hsl to hex"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Palette",
  related: ["og-image-generator", "image-convert", "image-resize", "image-compress"],
  faqs: [
    { q: "Which color formats can I paste?", a: "HEX (#ff0000 or #f00), rgb(), hsl(), oklch(), cmyk(), and CSS names such as rebeccapurple. The page fills HEX, RGB, HSL, OKLCH, and CMYK from that one value." },
    { q: "How is the contrast ratio measured?", a: "It is the WCAG 2 contrast ratio from relative luminance. 4.5:1 passes AA for normal text. 3:1 passes AA for large text and interface components. 7:1 passes AAA for normal text. Large text AAA uses 4.5:1." },
    { q: "Do transparent colors count?", a: "Yes. A color with alpha is flattened over the background you pick, then the ratio is measured on that opaque result." },
    { q: "What is OKLCH?", a: "OKLCH is lightness, chroma, and hue in the OKLab space. Lightness tracks what looks lighter, so it is easier to build a ramp than HSL." },
    { q: "Is the CMYK value a print profile?", a: "No. It is the simple device conversion from the sRGB bytes: the black plate is whatever the darkest channel leaves behind. A press profile will differ." },
    { q: "What does the Tailwind name mean?", a: "It is the nearest token in the current Tailwind palette, measured in OKLab. red-500 next to pure red means that token is the closest chip, not that the hex is identical." },
  ],
  seo: {
    title: "HEX to RGB and contrast checker",
    description: "Convert HEX, RGB, HSL, OKLCH, and CMYK, and check the WCAG contrast ratio with AA and AAA flags.",
  },
  howTo: [
    { name: "Paste a color", text: "Use HEX, rgb(), hsl(), oklch(), cmyk(), or a CSS name. The swatch and every format update together." },
    { name: "Copy the format you need", text: "Each row has its own copy button for HEX, RGB, HSL, OKLCH, and CMYK." },
    { name: "Check the contrast", text: "Set a background. The ratio and the AA and AAA flags use WCAG 2, after flattening any transparency." },
  ],
  inputs: "A foreground color in HEX, RGB, HSL, OKLCH, CMYK, or a CSS name, and a background color.",
  outputs: "HEX, RGB, HSL, OKLCH, CMYK, the nearest Tailwind token, and the WCAG contrast ratio.",
  runsLocally: true,
  badges: ["HEX · RGB · HSL · OKLCH · CMYK"],
} satisfies ToolMeta;
