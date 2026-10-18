import { PDFDocument, degrees } from "pdf-lib";
import { assertByteSize } from "@/lib/format";

export const turns = [0, 90, 180, 270] as const;
export type QuarterTurn = (typeof turns)[number];

export type PagePlan = {
  source: number;
  rotate: QuarterTurn;
};

export function nextTurn(rotate: QuarterTurn): QuarterTurn {
  const index = turns.indexOf(rotate);
  return turns[(index + 1) % turns.length] ?? 0;
}

export function assertPlan(plan: PagePlan[], pageCount: number): PagePlan[] {
  if (plan.length < 1) throw new Error("Keep at least one page.");
  if (plan.length > 500) throw new Error("Organize up to 500 pages.");
  return plan.map((item) => {
    if (!Number.isInteger(item.source) || item.source < 1 || item.source > pageCount) {
      throw new Error(`Page ${item.source} is outside this PDF. It has ${pageCount} ${pageCount === 1 ? "page" : "pages"}.`);
    }
    if (!turns.includes(item.rotate)) throw new Error("Rotation is 0, 90, 180, or 270 degrees.");
    return { source: item.source, rotate: item.rotate };
  });
}

export async function inspectPdf(data: Uint8Array, label = "This PDF") {
  const doc = await openPdf(data, label);
  return { pageCount: doc.getPageCount() };
}

export async function organizePdf(data: Uint8Array, plan: PagePlan[]) {
  const source = await openPdf(data, "This PDF");
  const checked = assertPlan(plan, source.getPageCount());
  const out = await PDFDocument.create();
  const copied = await out.copyPages(source, checked.map((item) => item.source - 1));
  checked.forEach((item, index) => {
    const page = copied[index];
    if (!page) return;
    const existing = page.getRotation().angle;
    page.setRotation(degrees((existing + item.rotate) % 360));
    out.addPage(page);
  });
  const bytes = await out.save();
  return { bytes, pageCount: out.getPageCount() };
}

async function openPdf(data: Uint8Array, label: string) {
  assertByteSize(data, label);
  try {
    return await PDFDocument.load(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/encrypted/i.test(message)) throw new Error(`${label} is encrypted. Unlock it with the password first.`);
    if (/header|Failed to parse/i.test(message)) throw new Error(`${label} is not a PDF.`);
    throw new Error(`${label} could not be read.`);
  }
}
