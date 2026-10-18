export const OG_FONT_FILES = [
  { name: "Geist", file: "Geist-Regular.ttf", weight: 400, style: "normal" },
  { name: "Geist", file: "Geist-Medium.ttf", weight: 500, style: "normal" },
  { name: "Geist", file: "Geist-SemiBold.ttf", weight: 600, style: "normal" },
  { name: "Geist", file: "Geist-Bold.ttf", weight: 700, style: "normal" },
  { name: "Geist Mono", file: "GeistMono-Regular.ttf", weight: 400, style: "normal" },
  { name: "Geist Mono", file: "GeistMono-Medium.ttf", weight: 500, style: "normal" },
  { name: "Instrument Serif", file: "InstrumentSerif-Regular.ttf", weight: 400, style: "normal" },
  { name: "Instrument Serif", file: "InstrumentSerif-Italic.ttf", weight: 400, style: "italic" },
] as const;

export type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 600 | 700;
  style: "normal" | "italic";
};
