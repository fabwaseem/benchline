import { z } from "zod";
import { AES_ITERATIONS_DEFAULT, AES_ITERATIONS_MAX, AES_ITERATIONS_MIN, decryptBundle, encryptText } from "@/tools/aes-crypto/lib/aes";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  mode: z.enum(["encrypt", "decrypt"]),
  passphrase: z.string().min(1),
  text: z.string().optional().describe("Plaintext to encrypt (encrypt mode)"),
  bundle: z.string().optional().describe("Base64 bundle from a previous encryption (decrypt mode)"),
  iterations: z.number().int().min(AES_ITERATIONS_MIN).max(AES_ITERATIONS_MAX).default(AES_ITERATIONS_DEFAULT),
});

export const outputSchema = z.object({
  mode: z.enum(["encrypt", "decrypt"]),
  bundle: z.string().optional(),
  plaintext: z.string().optional(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  if (parsed.mode === "encrypt") {
    if (!parsed.text) throw new Error("Encrypt mode needs 'text'.");
    const result = await encryptText(parsed.text, parsed.passphrase, parsed.iterations);
    if ("error" in result) throw new Error(result.error);
    return outputSchema.parse({ mode: "encrypt", bundle: result.bundle });
  }
  if (!parsed.bundle) throw new Error("Decrypt mode needs 'bundle'.");
  const result = await decryptBundle(parsed.bundle, parsed.passphrase);
  if ("error" in result) throw new Error(result.error);
  return outputSchema.parse({ mode: "decrypt", plaintext: result.plaintext });
}

export const tool: BenchTool = {
  slug: "aes-crypto",
  name: "aes_crypt",
  title: "Encrypt or decrypt with AES-GCM",
  description: "AES-256-GCM encryption with PBKDF2-SHA256 key derivation. Encrypt returns a base64 bundle (salt, IV, ciphertext); decrypt reverses it.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
