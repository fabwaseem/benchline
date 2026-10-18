export const ocrLanguages = [
  ["eng", "English"],
  ["spa", "Spanish"],
  ["fra", "French"],
  ["deu", "German"],
  ["por", "Portuguese"],
  ["ita", "Italian"],
  ["nld", "Dutch"],
  ["pol", "Polish"],
  ["tur", "Turkish"],
  ["rus", "Russian"],
  ["ara", "Arabic"],
  ["hin", "Hindi"],
  ["chi_sim", "Chinese (simplified)"],
  ["jpn", "Japanese"],
  ["kor", "Korean"],
] as const;

export type OcrLanguage = (typeof ocrLanguages)[number][0];

export function ocrLanguage(value: string): OcrLanguage {
  const found = ocrLanguages.find((item) => item[0] === value);
  if (!found) throw new Error("Choose a supported language.");
  return found[0];
}

export function cleanOcrText(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function roundConfidence(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}
