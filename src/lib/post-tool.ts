import { emitRun, slugForToolRequest } from "@/lib/analytics/browser";

function utf8Size(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

export async function postTool<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const started = performance.now();
  const slug = slugForToolRequest(path);
  const payload = JSON.stringify(body);
  const inputBytes = utf8Size(payload);
  let reported = false;
  const report = (outcome: "ok" | "error" | "rejected", errorCode?: string, outputBytes?: number) => {
    if (!slug || reported) return;
    reported = true;
    emitRun({ slug, outcome, errorCode, durationMs: Math.round(performance.now() - started), inputBytes, outputBytes });
  };
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      signal,
    });
    const text = await response.text();
    const outputBytes = utf8Size(text);
    let data: T & { error?: string };
    try {
      data = JSON.parse(text) as T & { error?: string };
    } catch {
      report("error", "invalid_json", outputBytes);
      throw new Error("The request failed.");
    }
    if (!response.ok) {
      report(response.status === 429 ? "rejected" : "error", response.status === 429 ? "rate_limit" : `http_${response.status}`, outputBytes);
      throw new Error(data.error || "The request failed.");
    }
    report("ok", undefined, outputBytes);
    return data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    if (!reported) report("error", "network");
    throw error;
  }
}
