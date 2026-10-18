import { z } from "zod";
import { generatePassphrases, generatePasswords, passwordStrength } from "@/tools/password-generator/lib/password";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  style: z.enum(["password", "passphrase"]).default("password"),
  length: z.number().int().default(20),
  lowercase: z.boolean().default(true),
  uppercase: z.boolean().default(true),
  digits: z.boolean().default(true),
  symbols: z.boolean().default(false),
  excludeAmbiguous: z.boolean().default(true),
  words: z.number().int().default(6),
  separator: z.string().default("-"),
  capitalize: z.boolean().default(false),
  digit: z.boolean().default(false),
  count: z.number().int().default(1),
});

export const outputSchema = z.object({
  values: z.array(z.string()),
  bits: z.number(),
  label: z.string(),
  score: z.number().int(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  if (parsed.style === "passphrase") {
    const result = generatePassphrases(parsed, parsed.count);
    if ("error" in result) throw new Error(result.error);
    return outputSchema.parse({ values: result.phrases, ...result.strength });
  }
  const values = generatePasswords(parsed, parsed.count);
  if ("error" in values) throw new Error(values.error);
  const strength = passwordStrength(parsed);
  if ("error" in strength) throw new Error(strength.error);
  return outputSchema.parse({ values, ...strength });
}

export const tool: BenchTool = {
  slug: "password-generator",
  name: "generate_password",
  title: "Generate a password or passphrase",
  description: "Generate cryptographic passwords or EFF-wordlist passphrases and report the entropy in bits. Randomness comes from the platform CSPRNG.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
