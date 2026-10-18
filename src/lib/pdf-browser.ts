type BrowserPdf = {
  numPages: number;
  getPage: (page: number) => Promise<{
    getTextContent: () => Promise<{ items: unknown[] }>;
    getViewport: (params: { scale: number }) => { width: number; height: number };
    render: (params: {
      canvas: HTMLCanvasElement | null;
      canvasContext: CanvasRenderingContext2D;
      viewport: { width: number; height: number };
    }) => { promise: Promise<void> };
  }>;
  destroy: () => Promise<void> | void;
};

type PdfjsModule = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (src: Record<string, unknown>) => { promise: Promise<BrowserPdf>; destroy: () => Promise<void> };
};

let workerReady = false;

export async function openBrowserPdf(data: Uint8Array) {
  const specifier = "/pdfjs/pdf.mjs";
  const pdfjs = (await import(/* webpackIgnore: true */ specifier)) as unknown as PdfjsModule;
  if (!workerReady) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
    workerReady = true;
  }
  const task = pdfjs.getDocument({
    data: data.slice(),
    isEvalSupported: false,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
    wasmUrl: "/pdfjs/wasm/",
  });
  const pdf = await task.promise;
  return Object.assign(pdf, { destroy: () => task.destroy() });
}
