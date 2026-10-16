import { z } from "zod";
import { decodeJwt, isDecoded, type JwtClaims } from "@/tools/jwt-decoder/lib/jwt";
import type { BenchTool } from "@/lib/mcp/types";

const claim = z.object({
  name: z.string(),
  iso: z.string(),
  raw: z.string(),
});

export const inputSchema = z.object({
  token: z.string().describe("A signed JWT, with or without a Bearer prefix. The signature is not verified."),
});

export const outputSchema = z.object({
  ok: z.boolean(),
  error: z.string(),
  kind: z.string(),
  header: z.record(z.string(), z.unknown()),
  payload: z.record(z.string(), z.unknown()),
  signature: z.string(),
  claims: z.array(claim),
});

const registered = ["iss", "sub", "aud", "exp", "nbf", "iat", "jti"] as const;

function claimsOf(payload: JwtClaims) {
  return registered.flatMap((name) => {
    if (!(name in payload)) return [];
    const value = payload[name];
    const iso =
      (name === "exp" || name === "nbf" || name === "iat") && typeof value === "number"
        ? new Date(value * 1000).toISOString()
        : "";
    const raw = Array.isArray(value)
      ? value.map(String).join(", ")
      : typeof value === "string"
        ? value
        : JSON.stringify(value);
    return [{ name, iso, raw }];
  });
}

async function run(input: unknown) {
  const { token } = inputSchema.parse(input);
  const decoded = decodeJwt(token);
  if (!isDecoded(decoded)) {
    return outputSchema.parse({
      ok: false,
      error: decoded.error,
      kind: decoded.kind,
      header: {},
      payload: {},
      signature: "",
      claims: [],
    });
  }
  return outputSchema.parse({
    ok: true,
    error: "",
    kind: "",
    header: decoded.header,
    payload: decoded.payload,
    signature: decoded.signature,
    claims: claimsOf(decoded.payload),
  });
}

export const tool: BenchTool = {
  slug: "jwt-decoder",
  name: "decode_jwt",
  title: "Decode a JWT",
  description: "Decode a signed JSON Web Token into its header, payload, and registered claims. Dates are absolute ISO timestamps. The signature is not checked.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
