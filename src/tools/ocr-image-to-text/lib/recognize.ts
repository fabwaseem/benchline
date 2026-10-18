import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { createWorker } from "tesseract.js";
import { cleanOcrText, ocrLanguage, roundConfidence, type OcrLanguage } from "@/tools/ocr-image-to-text/lib/text";

type Engine = Awaited<ReturnType<typeof createWorker>>;

let engine: Engine | null = null;
let language: OcrLanguage | null = null;
let queue: Promise<unknown> = Promise.resolve();

const require = createRequire(`${process.cwd()}/package.json`);

function workerOptions() {
  const packageRoot = dirname(require.resolve("tesseract.js/package.json"));
  const coreDir = dirname(require.resolve("tesseract.js-core/package.json"));
  return {
    workerPath: join(packageRoot, "src/worker-script/node/index.js"),
    corePath: join(coreDir, "/"),
  };
}

async function engineFor(code: OcrLanguage) {
  if (!engine) {
    engine = await createWorker(code, 1, workerOptions());
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
