import { createWorker } from "tesseract.js";
import { cleanOcrText, ocrLanguage, roundConfidence, type OcrLanguage } from "@/tools/ocr-image-to-text/lib/text";

type Engine = Awaited<ReturnType<typeof createWorker>>;

let engine: Engine | null = null;
let language: OcrLanguage | null = null;
let queue: Promise<unknown> = Promise.resolve();

async function engineFor(code: OcrLanguage) {
  if (!engine) {
    engine = await createWorker(code);
    language = code;
    await engine.setParameters({ user_defined_dpi: "150" });
    return engine;
  }
  if (language !== code) {
    await engine.reinitialize(code);
    language = code;
  }
  return engine;
}

export async function recognizeImage(bytes: Uint8Array, requested: string) {
  const code = ocrLanguage(requested);
  const run = queue.then(async () => {
    const worker = await engineFor(code);
    const result = await worker.recognize(Buffer.from(bytes));
    return {
      text: cleanOcrText(result.data.text),
      confidence: roundConfidence(result.data.confidence),
      language: code,
    };
  });
  queue = run.then(() => undefined, () => undefined);
  return run;
}
