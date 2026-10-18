import { assertByteSize } from "@/lib/format";
import { parsePageSelection } from "@/lib/page-range";
import { openBrowserPdf } from "@/lib/pdf-browser";
import { pdfFailure } from "@/lib/pdf-error";
import {
  MAX_RENDER_PAGES,
  assertQuality,
  imageName,
  packImages,
  scaleForDpi,
  type ImageFormat,
  type RenderedImage,
} from "@/tools/pdf-to-image/lib/plan";

export async function renderPdfInBrowser(
  data: Uint8Array,
  options: { format: ImageFormat; dpi: number; range: string; quality: number; stem?: string },
) {
  assertByteSize(data, "This PDF");
  const scale = scaleForDpi(options.dpi);
  const quality = assertQuality(options.quality);
  const pdf = await openBrowserPdf(data);
  try {
    const selected = parsePageSelection(options.range, pdf.numPages);
    if (selected.length > MAX_RENDER_PAGES) throw new Error(`Render up to ${MAX_RENDER_PAGES} pages at a time.`);
    const images: RenderedImage[] = [];
    for (const pageNumber of selected) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("This browser could not draw the page.");
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (value) => (value ? resolve(value) : reject(new Error("Could not encode the page."))),
          options.format === "jpeg" ? "image/jpeg" : "image/png",
          quality / 100,
        );
      });
      images.push({
        name: imageName(options.stem || "page", pageNumber, options.format),
        bytes: new Uint8Array(await blob.arrayBuffer()),
        width: canvas.width,
        height: canvas.height,
      });
    }
    return { images, zip: packImages(images), pageCount: pdf.numPages };
  } catch (error) {
    if (error instanceof Error && /Render up to|DPI|Quality|page|range|25 MB|encode|draw/.test(error.message)) throw error;
    throw new Error(pdfFailure(error));
  } finally {
    await pdf.destroy();
  }
}
