import { assertByteSize } from "@/lib/format";
import { parsePageSelection } from "@/lib/page-range";
import { pdfFailure } from "@/lib/pdf-error";
import { withNodePdf } from "@/lib/pdf-node";
import {
  MAX_RENDER_PAGES,
  assertQuality,
  imageName,
  packImages,
  scaleForDpi,
  type ImageFormat,
  type RenderedImage,
} from "@/tools/pdf-to-image/lib/plan";

type CanvasLike = {
  width: number;
  height: number;
  getContext: (kind: "2d") => CanvasRenderingContext2D;
  toBuffer: (type: "image/png" | "image/jpeg", quality?: number) => Buffer;
};

class NodeCanvasFactory {
  constructor(private readonly createCanvas: (width: number, height: number) => CanvasLike) {}

  create(width: number, height: number) {
    const canvas = this.createCanvas(width, height);
    return { canvas, context: canvas.getContext("2d") };
  }

  reset(pair: { canvas: CanvasLike }, width: number, height: number) {
    pair.canvas.width = width;
    pair.canvas.height = height;
  }

  destroy(pair: { canvas: CanvasLike }) {
    pair.canvas.width = 0;
    pair.canvas.height = 0;
  }
}

export type RenderRequest = {
  format: ImageFormat;
  dpi: number;
  range: string;
  quality: number;
  stem?: string;
};

export async function renderPdfPages(data: Uint8Array, options: RenderRequest) {
  assertByteSize(data, "This PDF");
  const scale = scaleForDpi(options.dpi);
  const quality = assertQuality(options.quality);
  const canvasApi = await import("@napi-rs/canvas");
  const globals = globalThis as {
    DOMMatrix?: unknown;
    ImageData?: unknown;
    Path2D?: unknown;
  };
  globals.DOMMatrix = canvasApi.DOMMatrix;
  globals.ImageData = canvasApi.ImageData;
  globals.Path2D = canvasApi.Path2D;
  const factory = new NodeCanvasFactory((width, height) => canvasApi.createCanvas(width, height) as unknown as CanvasLike);
  try {
    return await withNodePdf(data, async (pdf) => {
      const selected = parsePageSelection(options.range, pdf.numPages);
      if (selected.length > MAX_RENDER_PAGES) throw new Error(`Render up to ${MAX_RENDER_PAGES} pages at a time.`);
      const images: RenderedImage[] = [];
      for (const pageNumber of selected) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        const pair = factory.create(Math.ceil(viewport.width), Math.ceil(viewport.height));
        pair.context.fillStyle = "white";
        pair.context.fillRect(0, 0, pair.canvas.width, pair.canvas.height);
        await page.render({
          canvas: null,
          canvasContext: pair.context,
          viewport,
        }).promise;
        const encoded = options.format === "jpeg"
          ? pair.canvas.toBuffer("image/jpeg", quality)
          : pair.canvas.toBuffer("image/png");
        images.push({
          name: imageName(options.stem || "page", pageNumber, options.format),
          bytes: new Uint8Array(encoded),
          width: pair.canvas.width,
          height: pair.canvas.height,
        });
        factory.destroy(pair);
      }
      return { images, zip: packImages(images), pageCount: pdf.numPages };
    }, { canvasFactory: factory });
  } catch (error) {
    if (error instanceof Error && /Render up to|DPI|Quality|page|range|25 MB|not a PDF|encrypted/.test(error.message)) throw error;
    throw new Error(pdfFailure(error));
  }
}
