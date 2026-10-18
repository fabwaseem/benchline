"use client";

export type ModelProgress = { label: string; percent: number };

type Cutout = { toBlob: (type?: string) => Promise<unknown> };

let session: Promise<(input: string) => Promise<Cutout>> | null = null;

export function loadPortraitModel(onProgress: (progress: ModelProgress) => void) {
  session ??= (async () => {
    const { pipeline, env } = await import("@huggingface/transformers");
    env.allowLocalModels = false;
    const segmenter = await pipeline("background-removal", "Xenova/modnet", {
      dtype: "uint8",
      device: "wasm",
      progress_callback: (info) => {
        if (info.status === "progress" || info.status === "progress_total") {
          onProgress({ label: "Downloading the portrait model", percent: info.progress });
        } else if (info.status === "ready") {
          onProgress({ label: "Portrait model ready", percent: 100 });
        } else {
          onProgress({ label: "Downloading the portrait model", percent: 4 });
        }
      },
    });
    return async (input: string) => {
      const output: unknown = await segmenter(input);
      if (!output || typeof output !== "object" || !("toBlob" in output) || typeof output.toBlob !== "function") {
        throw new Error("The model did not return an image.");
      }
      return output as Cutout;
    };
  })();
  return session;
}

export async function removePortraitBackground(blob: Blob, onProgress: (progress: ModelProgress) => void) {
  const segmenter = await loadPortraitModel(onProgress);
  onProgress({ label: "Removing the background", percent: 96 });
  const url = URL.createObjectURL(blob);
  try {
    const output = await segmenter(url);
    const result = await output.toBlob("image/png");
    if (!(result instanceof Blob)) throw new Error("The model did not return an image.");
    return result;
  } finally {
    URL.revokeObjectURL(url);
  }
}
