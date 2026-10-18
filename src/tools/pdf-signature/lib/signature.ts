import { PDFDocument } from "pdf-lib";
import { assertByteSize } from "@/lib/format";

export type Point = { x: number; y: number };

export type SignaturePlacement = {
  /** 1-based page number. */
  page: number;
  /** Horizontal position, 0..1 as a fraction of page width, measured from the left. */
  x: number;
  /** Vertical position, 0..1 as a fraction of page height, measured from the top. */
  y: number;
  /** Signature width, 0..1 as a fraction of page width. Height follows the signature's aspect ratio. */
  width: number;
};

export type PlacementRect = {
  /** PDF points, origin at bottom-left. */
  x: number;
  /** PDF points, origin at bottom-left. */
  y: number;
  /** PDF points. */
  width: number;
  /** PDF points. */
  height: number;
};

export type SignResult = {
  bytes: Uint8Array;
  pageCount: number;
};

/**
 * Smooth a freehand stroke with Chaikin corner cutting. Each segment
 * P0 -> P1 gains two new points at 1/4 and 3/4, so sharp corners are
 * replaced by a polyline that hugs the original path. Returns []
 * when there are fewer than two points to smooth.
 */
export function smoothStroke(points: Point[]): Point[] {
  if (points.length < 2) return [];
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return [];
  const smoothed: Point[] = [{ x: first.x, y: first.y }];
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    if (!current || !next) continue;
    smoothed.push({
      x: current.x * 0.75 + next.x * 0.25,
      y: current.y * 0.75 + next.y * 0.25,
    });
    smoothed.push({
      x: current.x * 0.25 + next.x * 0.75,
      y: current.y * 0.25 + next.y * 0.75,
    });
  }
  smoothed.push({ x: last.x, y: last.y });
  return smoothed;
}

function fraction(value: number, label: string, { allowZero = true, max = 1 } = {}) {
  if (!Number.isFinite(value)) throw new Error(`Placement ${label} must be a number.`);
  const low = allowZero ? 0 : Number.MIN_VALUE;
  if (value < low || value > max) {
    throw new Error(`Placement ${label} must be between ${allowZero ? "0" : "above 0"} and ${max}, as a fraction of the page.`);
  }
}

/**
 * Convert a placement (fractions of the page, origin top-left) to PDF
 * coordinates (points, origin bottom-left), so the y axis is flipped.
 * Throws a descriptive error when any value is out of range.
 */
export function placementRect(
  pageWidth: number,
  pageHeight: number,
  sigAspect: number,
  placement: SignaturePlacement,
): PlacementRect {
  if (!Number.isFinite(pageWidth) || pageWidth <= 0) throw new Error("Page width must be a positive number.");
  if (!Number.isFinite(pageHeight) || pageHeight <= 0) throw new Error("Page height must be a positive number.");
  if (!Number.isFinite(sigAspect) || sigAspect <= 0) throw new Error("Signature aspect ratio must be a positive number.");
  if (!Number.isInteger(placement.page) || placement.page < 1) {
    throw new Error("Placement page must be a whole page number of 1 or more.");
  }
  fraction(placement.x, "x");
  fraction(placement.y, "y");
  fraction(placement.width, "width", { allowZero: false });

  const width = placement.width * pageWidth;
  const height = width / sigAspect;
  return {
    x: placement.x * pageWidth,
    y: pageHeight - placement.y * pageHeight - height,
    width,
    height,
  };
}

export async function inspectSignaturePdf(data: Uint8Array, label = "This PDF") {
  assertByteSize(data, label);
  try {
    const doc = await PDFDocument.load(data);
    const first = doc.getPage(0);
    return {
      pageCount: doc.getPageCount(),
      pageWidth: first?.getWidth() ?? 0,
      pageHeight: first?.getHeight() ?? 0,
    };
  } catch (error) {
    throw pdfReadError(error, label);
  }
}

/**
 * Draw a PNG signature image onto the given placements. The signature
 * keeps its aspect ratio; `width` is the placement width as a page
 * fraction. Returns the saved PDF bytes and its page count.
 */
export async function placeSignatures(
  pdfBytes: Uint8Array,
  signaturePng: Uint8Array,
  placements: SignaturePlacement[],
): Promise<SignResult> {
  if (placements.length === 0) throw new Error("Add at least one signature placement.");
  assertByteSize(pdfBytes, "The PDF");
  const doc = await openPdf(pdfBytes, "The PDF");
  const pageCount = doc.getPageCount();

  let signature;
  try {
    signature = await doc.embedPng(signaturePng);
  } catch {
    throw new Error("The signature must be a PNG image.");
  }
  const sigAspect = signature.width / signature.height;

  for (const placement of placements) {
    if (placement.page > pageCount) {
      throw new Error(`Placement page ${placement.page} is past the end of the document (${pageCount} ${pageCount === 1 ? "page" : "pages"}).`);
    }
    const page = doc.getPage(placement.page - 1);
    const rect = placementRect(page.getWidth(), page.getHeight(), sigAspect, placement);
    page.drawImage(signature, rect);
  }

  const bytes = await doc.save();
  return { bytes, pageCount };
}

async function openPdf(data: Uint8Array, label: string) {
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
