import { PDFDocument } from "pdf-lib";
import { assertByteSize } from "@/lib/format";

export const pageSizes = ["a4", "letter", "fit"] as const;
export const orientations = ["auto", "portrait", "landscape"] as const;
export type PageSizeName = (typeof pageSizes)[number];
export type Orientation = (typeof orientations)[number];

export const PAGE_POINTS = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
} as const;

const FIT_LONG_EDGE = 841.89;
export const MAX_IMAGES = 40;

export type ImageLayout = {
  pageWidth: number;
  pageHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PdfImage = {
  data: Uint8Array;
  kind: "jpg" | "png";
};

export function layoutImage(input: {
  page: PageSizeName;
  orientation: Orientation;
  margin: number;
  imageWidth: number;
  imageHeight: number;
}): ImageLayout {
  if (input.imageWidth < 1 || input.imageHeight < 1) throw new Error("The image has no pixels.");
  if (!Number.isFinite(input.margin) || input.margin < 0 || input.margin > 144) {
    throw new Error("Margin must be between 0 and 144 points.");
  }
  const wider = input.imageWidth > input.imageHeight;
  const landscape = input.orientation === "landscape" || (input.orientation === "auto" && wider);
  let pageWidth: number;
  let pageHeight: number;
  if (input.page === "fit") {
    const long = Math.max(input.imageWidth, input.imageHeight);
    const scale = FIT_LONG_EDGE / long;
    pageWidth = roundPt(input.imageWidth * scale);
    pageHeight = roundPt(input.imageHeight * scale);
  } else {
    const base = PAGE_POINTS[input.page];
    pageWidth = landscape ? base.height : base.width;
    pageHeight = landscape ? base.width : base.height;
  }
  const maxMargin = Math.max(0, Math.min(pageWidth, pageHeight) / 2 - 1);
  const margin = Math.min(input.margin, maxMargin);
  const boxWidth = pageWidth - margin * 2;
  const boxHeight = pageHeight - margin * 2;
  const scale = Math.min(boxWidth / input.imageWidth, boxHeight / input.imageHeight);
  const width = roundPt(input.imageWidth * scale);
  const height = roundPt(input.imageHeight * scale);
  return {
    pageWidth,
    pageHeight,
    width,
    height,
    x: roundPt(margin + (boxWidth - width) / 2),
    y: roundPt(margin + (boxHeight - height) / 2),
  };
}

export async function imagesToPdf(
  images: PdfImage[],
  options: { page: PageSizeName; orientation: Orientation; margin: number },
): Promise<{ bytes: Uint8Array; pageCount: number }> {
  if (images.length === 0) throw new Error("Add at least one image.");
  if (images.length > MAX_IMAGES) throw new Error(`Add up to ${MAX_IMAGES} images at a time.`);
  const doc = await PDFDocument.create();
  for (const [index, image] of images.entries()) {
    const label = `Image ${index + 1}`;
    assertByteSize(image.data, label);
    let embedded;
    try {
      embedded = image.kind === "jpg" ? await doc.embedJpg(image.data) : await doc.embedPng(image.data);
    } catch {
      throw new Error(`${label} is not a valid ${image.kind === "jpg" ? "JPEG" : "PNG"}.`);
    }
    const layout = layoutImage({
      ...options,
      imageWidth: embedded.width,
      imageHeight: embedded.height,
    });
    const page = doc.addPage([layout.pageWidth, layout.pageHeight]);
    page.drawImage(embedded, { x: layout.x, y: layout.y, width: layout.width, height: layout.height });
  }
  const bytes = await doc.save();
  return { bytes, pageCount: doc.getPageCount() };
}

function roundPt(value: number) {
  return Math.round(value * 100) / 100;
}
