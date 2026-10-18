import { z } from "zod";
import { encodeText, hashAlgorithms, hashAll, matchingAlgorithms } from "@/tools/hash-generator/lib/hash";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  text: z.string().optional().describe("UTF-8 text to hash. Use this or base64."),
  base64: z.string().optional().describe("Raw bytes as standard base64."),
  hmacKey: z.string().optional().describe("UTF-8 HMAC key. Omit it for a plain digest."),
  expected: z.string().optional().describe("Hex or base64 digest to compare."),
});

export const outputSchema = z.object({
  hashes: z.array(z.object({ algorithm: z.enum(hashAlgorithms), hex: z.string(), base64: z.string() })),
  matches: z.array(z.enum(hashAlgorithms)),
  hmac: z.boolean(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  if (parsed.text === undefined && parsed.base64 === undefined) throw new Error("Provide text or base64.");
  if (parsed.text !== undefined && parsed.base64 !== undefined) throw new Error("Provide text or base64, not both.");
  const data = parsed.text !== undefined ? encodeText(parsed.text) : decodeBase64(parsed.base64 ?? "");
  const key = parsed.hmacKey === undefined ? undefined : encodeText(parsed.hmacKey);
  const hashes = await hashAll(data, key);
  return outputSchema.parse({
    hashes,
    matches: matchingAlgorithms(hashes, parsed.expected ?? ""),
    hmac: key !== undefined,
  });
}

export const tool: BenchTool = {
  slug: "hash-generator",
  name: "hash_data",
  title: "Hash text or bytes",
  description: "Compute MD5, SHA-1, SHA-256, and SHA-512 for UTF-8 text or base64 bytes. Pass hmacKey for HMAC and expected to see which digest matches.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};

function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}
