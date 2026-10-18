import { zipSync } from "fflate";
import { PDFDocument } from "pdf-lib";
import { assertByteSize } from "@/lib/format";
import { parsePageSelection } from "@/lib/page-range";

export const splitModes = ["extract", "pages", "chunks"] as const;
export type SplitMode = (typeof splitModes)[number];

export type SplitFile = {
  name: string;
  bytes: Uint8Array;
};

export type SplitResult = {
  files: SplitFile[];
  zip: Uint8Array | null;
  pageCount: number;
};

export async function inspectPdf(data: Uint8Array, label = "This PDF") {
  const doc = await openPdf(data, label);
  return { pageCount: doc.getPageCount() };
}

export function groupPages(pages: number[], mode: SplitMode, every: number): number[][] {
  if (pages.length === 0) throw new Error("Pick at least one page.");
  if (mode === "extract") return [pages];
  if (mode === "pages") return pages.map((page) => [page]);
  if (!Number.isInteger(every) || every < 1 || every > 500) {
    throw new Error("Split every N pages, where N is a whole number from 1 to 500.");
  }
  const groups: number[][] = [];
  for (let index = 0; index < pages.length; index += every) groups.push(pages.slice(index, index + every));
  return groups;
}

export function safeStem(name: string) {
  const stem = name.replace(/\.pdf$/i, "").replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").replace(/^[-.]+|[-.]+$/g, "");
  return stem.slice(0, 80) || "document";
}

export async function splitPdf(
  data: Uint8Array,
  options: { range: string; mode: SplitMode; every: number; name?: string },
): Promise<SplitResult> {
  const label = options.name || "This PDF";
  const source = await openPdf(data, label);
  const selected = parsePageSelection(options.range, source.getPageCount());
  const groups = groupPages(selected, options.mode, options.every);
  const stem = safeStem(options.name || "document.pdf");
  const files: SplitFile[] = [];
  for (let index = 0; index < groups.length; index += 1) {
    const group = groups[index] ?? [];
    const doc = await PDFDocument.create();
    const copied = await doc.copyPages(source, group.map((page) => page - 1));
    for (const page of copied) doc.addPage(page);
    files.push({ name: fileName(stem, options.mode, index, group), bytes: await doc.save() });
  }
  const zip = files.length > 1 ? zipSync(Object.fromEntries(files.map((file) => [file.name, file.bytes])), { level: 6 }) : null;
  return { files, zip, pageCount: selected.length };
}

function fileName(stem: string, mode: SplitMode, index: number, group: number[]) {
  if (mode === "extract") return `${stem}-extract.pdf`;
  if (mode === "pages") return `${stem}-page-${group[0] ?? index + 1}.pdf`;
  return `${stem}-part-${index + 1}.pdf`;
}

async function openPdf(data: Uint8Array, label: string) {
  assertByteSize(data, label);
  try {
    return await PDFDocument.load(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("encrypted")) throw new Error(`${label} is encrypted. Remove the password first.`);
    if (message.includes("No PDF header") || message.includes("Failed to parse")) throw new Error(`${label} is not a PDF.`);
    throw new Error(`${label} could not be read.`);
  }
}
