const LABELS: Record<string, string> = {
  QRCode: "QR Code",
  MicroQRCode: "Micro QR",
  Aztec: "Aztec",
  DataMatrix: "Data Matrix",
  PDF417: "PDF417",
  EAN13: "EAN-13",
  EAN8: "EAN-8",
  UPCA: "UPC-A",
  UPCE: "UPC-E",
  Code128: "Code 128",
  Code39: "Code 39",
  Code93: "Code 93",
  ITF: "ITF",
  Codabar: "Codabar",
};

export type BarcodeHit = {
  text: string;
  format: string;
  label: string;
};

export function formatLabel(format: string) {
  return LABELS[format] ?? format;
}

export function presentCode(format: string, text: string): BarcodeHit | null {
  const value = text.replace(/\u0000/g, "").trim();
  if (!value) return null;
  return { text: value, format, label: formatLabel(format) };
}

export function presentCodes(rows: readonly { format: string; text: string }[]): BarcodeHit[] {
  const seen = new Set<string>();
  const hits: BarcodeHit[] = [];
  for (const row of rows) {
    const hit = presentCode(row.format, row.text);
    if (!hit) continue;
    const key = `${hit.format}\n${hit.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push(hit);
    if (hits.length >= 8) break;
  }
  return hits;
}
