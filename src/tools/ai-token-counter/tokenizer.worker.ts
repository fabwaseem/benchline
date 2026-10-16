import { countTokens, type EncodingName } from "@/tools/ai-token-counter/lib/tokenize";

type RequestMessage = { id: number; text: string; encoding: EncodingName; preview: number };

self.onmessage = (event: MessageEvent<RequestMessage>) => {
  const { id, text, encoding, preview } = event.data;
  const result = countTokens(text, encoding, preview);
  self.postMessage({ id, ...result });
};
