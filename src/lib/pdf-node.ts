import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { pdfjsFolderUrl } from "@/lib/pdf-assets";

type PdfPage = {
  getTextContent: () => Promise<{ items: unknown[] }>;
  getViewport: (params: { scale: number }) => { width: number; height: number };
  render: (params: {
    canvas: HTMLCanvasElement | null;
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void> };
};

export type NodePdf = {
  numPages: number;
  getPage: (page: number) => Promise<PdfPage>;
  destroy: () => Promise<void> | void;
};

type PdfjsModule = {
  getDocument: (src: Record<string, unknown>) => { promise: Promise<NodePdf>; destroy: () => Promise<void> };
  GlobalWorkerOptions: { workerSrc: string };
};

const require = createRequire(`${process.cwd()}/package.json`);
let workerSrc = "";

function pdfWorkerSrc() {
  if (!workerSrc) {
    workerSrc = pathToFileURL(require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs")).href;
  }
  return workerSrc;
}

let depth = 0;
let originalFetch: typeof fetch | null = null;

function requestUrl(input: RequestInfo | URL) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

async function withFileFetch<T>(run: () => Promise<T>) {
  if (depth === 0) {
    const current = globalThis.fetch;
    originalFetch = current;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = requestUrl(input);
      if (url.startsWith("file:")) {
        const data = await readFile(fileURLToPath(url));
        return new Response(new Uint8Array(data));
      }
      return current(input, init);
    }) as typeof fetch;
  }
  depth += 1;
  try {
    return await run();
  } finally {
    depth -= 1;
    if (depth === 0 && originalFetch) {
      globalThis.fetch = originalFetch;
      originalFetch = null;
    }
  }
}

async function openDocument(data: Uint8Array, extra: Record<string, unknown>) {
  const pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as unknown as PdfjsModule;
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc();
  return pdfjs.getDocument({
    data: data.slice(),
    standardFontDataUrl: pdfjsFolderUrl("standard_fonts"),
    cMapUrl: pdfjsFolderUrl("cmaps"),
    wasmUrl: pdfjsFolderUrl("wasm"),
    cMapPacked: true,
    verbosity: 0,
    ...extra,
  });
}

export async function withNodePdf<T>(data: Uint8Array, run: (pdf: NodePdf) => Promise<T>, extra: Record<string, unknown> = {}) {
  return withFileFetch(async () => {
    const task = await openDocument(data, extra);
    const pdf = await task.promise;
    try {
      return await run(pdf);
    } finally {
      await task.destroy();
    }
  });
}
