import { z } from "zod";
import { generateHotp, generateTotp, TOTP_ALGORITHMS } from "@/tools/totp-generator/lib/totp";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  secret: z.string().min(1).describe("Base32 TOTP/HOTP secret"),
  mode: z.enum(["totp", "hotp"]).default("totp"),
  digits: z.union([z.literal(6), z.literal(8)]).default(6),
  period: z.number().int().positive().default(30).describe("TOTP period in seconds"),
  algorithm: z.enum(TOTP_ALGORITHMS).default("SHA1"),
  at: z.number().int().positive().optional().describe("Unix time in milliseconds; defaults to now"),
  counter: z.number().int().nonnegative().default(0).describe("HOTP counter"),
});

export const outputSchema = z.object({
  code: z.string(),
  mode: z.enum(["totp", "hotp"]),
  secondsRemaining: z.number().int().nullable(),
  period: z.number().int(),
  digits: z.number().int(),
  algorithm: z.string(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  if (parsed.mode === "hotp") {
    const code = await generateHotp(parsed.secret, parsed.counter, { digits: parsed.digits, algorithm: parsed.algorithm });
    if (typeof code !== "string") throw new Error(code.error);
    return outputSchema.parse({
      code,
      mode: "hotp",
      secondsRemaining: null,
      period: parsed.period,
      digits: parsed.digits,
      algorithm: parsed.algorithm,
    });
  }
  const result = await generateTotp(
    parsed.secret,
    { digits: parsed.digits, period: parsed.period, algorithm: parsed.algorithm },
    parsed.at ?? Date.now(),
  );
  if ("error" in result) throw new Error(result.error);
  return outputSchema.parse({
    code: result.code,
    mode: "totp",
    secondsRemaining: result.secondsRemaining,
    period: result.period,
    digits: parsed.digits,
    algorithm: parsed.algorithm,
  });
}

export const tool: BenchTool = {
  slug: "totp-generator",
  name: "generate_totp",
  title: "Generate a TOTP/HOTP one-time code",
  description: "Compute RFC 4226/6238 one-time passcodes from a base32 secret. Supports 6/8 digits, SHA1/SHA256/SHA512, and custom periods.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
