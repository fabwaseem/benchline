import { PDFDocument } from "pdf-lib";
import { assertByteSize } from "@/lib/format";
import { parsePageSelection } from "@/lib/page-range";

export const MAX_PDFS = 25;

export type MergeSource = {
  name: string;
  data: Uint8Array;
  pages?: string;
};

export type MergeResult = {
  bytes: Uint8Array;
  pageCount: number;
};

export async function inspectPdf(data: Uint8Array, label = "This PDF") {
  const doc = await openPdf(data, label);
  return { pageCount: doc.getPageCount() };
}

export async function mergePdfs(sources: MergeSource[]): Promise<MergeResult> {
  if (sources.length < 2) throw new Error("Add at least two PDFs.");
  if (sources.length > MAX_PDFS) throw new Error(`Merge up to ${MAX_PDFS} PDFs at a time.`);
  const merged = await PDFDocument.create();
  for (const source of sources) {
    const label = source.name || "A PDF";
    const doc = await openPdf(source.data, label);
    const selected = parsePageSelection(source.pages ?? "", doc.getPageCount());
    const copied = await merged.copyPages(doc, selected.map((page) => page - 1));
    for (const page of copied) merged.addPage(page);
  }
  const bytes = await merged.save();
  return { bytes, pageCount: merged.getPageCount() };
}

async function openPdf(data: Uint8Array, label: string) {
  assertByteSize(data, label);
  try {
    return await PDFDocument.load(data);
  } catch (error) {
    throw pdfReadError(error, label);
  }
}

function pdfReadError(error: unknown, label: string) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("encrypted")) return new Error(`${label} is encrypted. Remove the password first.`);
  if (message.includes("No PDF header") || message.includes("Failed to parse")) return new Error(`${label} is not a PDF.`);
  return new Error(`${label} could not be read.`);
}
