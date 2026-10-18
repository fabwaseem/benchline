import { z } from "zod";
import type { BenchTool } from "@/lib/mcp/types";
import { generateMaterial, jwkToMaterial, keyAlgorithms, pemToMaterial } from "@/tools/rsa-keypair/lib/keys";

export const inputSchema = z.object({
  action: z.enum(["generate", "to_jwk", "to_pem"]).default("generate"),
  alg: z.enum(keyAlgorithms).default("ES256"),
  modulusLength: z.union([z.literal(2048), z.literal(4096)]).default(2048),
  pem: z.string().optional().describe("SPKI or PKCS8 PEM to convert. Required for to_jwk."),
  jwk: z.string().optional().describe("JWK JSON to convert. Required for to_pem."),
});

export const outputSchema = z.object({
  alg: z.enum(keyAlgorithms),
  publicPem: z.string(),
  privatePem: z.string(),
  publicJwk: z.string(),
  privateJwk: z.string(),
  jwks: z.string(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  if (parsed.action === "to_jwk") {
    const result = await pemToMaterial(parsed.pem ?? "", parsed.alg);
    if ("error" in result) throw new Error(result.error);
    return outputSchema.parse(result);
  }
  if (parsed.action === "to_pem") {
    const result = await jwkToMaterial(parsed.jwk ?? "", parsed.alg);
    if ("error" in result) throw new Error(result.error);
    return outputSchema.parse(result);
  }
  return outputSchema.parse(await generateMaterial(parsed.alg, parsed.modulusLength));
}

export const tool: BenchTool = {
  slug: "rsa-keypair",
  name: "generate_keypair",
  title: "Generate or convert a key pair",
  description: "Generate an RSA, EC, or Ed25519 key pair as PEM and JWK, or convert between PEM and JWK. The private key is returned in the result and is not stored. The page in the browser generates keys locally and does not send them.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
