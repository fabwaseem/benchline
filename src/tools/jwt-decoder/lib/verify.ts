import {
  SignJWT,
  createLocalJWKSet,
  importJWK,
  importSPKI,
  jwtVerify,
  type JWK,
  type JWTPayload,
} from "jose";

export type VerifyResult =
  | { status: "verified"; payload: JWTPayload }
  | { status: "invalid"; message: string }
  | { status: "unsupported"; message: string }
  | { status: "idle"; message: string };

const HMAC = new Set(["HS256", "HS384", "HS512"]);
const ASYMMETRIC = new Set([
  "RS256", "RS384", "RS512",
  "PS256", "PS384", "PS512",
  "ES256", "ES384", "ES512",
  "EdDSA",
]);

export async function verifyJwt(token: string, alg: string, secret: string, encoding: "utf8" | "base64"): Promise<VerifyResult> {
  if (!secret.trim()) return { status: "idle", message: "Add a secret or public key to check the signature." };
  if (alg === "none") return { status: "unsupported", message: "alg none has no signature to verify." };
  try {
    if (HMAC.has(alg)) {
      const key = encoding === "base64" ? base64Key(secret) : new TextEncoder().encode(secret);
      const result = await jwtVerify(token, key, { algorithms: [alg] });
      return { status: "verified", payload: result.payload };
    }
    if (!ASYMMETRIC.has(alg)) return { status: "unsupported", message: `${alg || "This algorithm"} is not supported.` };
    const key = await importPublic(secret, alg);
    const result = await jwtVerify(token, key, { algorithms: [alg] });
    return { status: "verified", payload: result.payload };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    if (/alg|algorithm|unsupported/i.test(message)) return { status: "unsupported", message };
    return { status: "invalid", message: "Invalid signature" };
  }
}

async function importPublic(secret: string, alg: string) {
  const trimmed = secret.trim();
  if (trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed) as JWK | { keys?: JWK[] };
    if ("keys" in parsed && Array.isArray(parsed.keys)) return createLocalJWKSet({ keys: parsed.keys });
    return importJWK(parsed as JWK, alg);
  }
  return importSPKI(trimmed, alg);
}

function base64Key(secret: string) {
  const binary = atob(secret.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function signHs(headerJson: string, payloadJson: string, secret: string, alg: "HS256" | "HS384" | "HS512") {
  const header = JSON.parse(headerJson) as { alg?: string; typ?: string };
  const payload = JSON.parse(payloadJson) as JWTPayload;
  const jwt = new SignJWT(payload).setProtectedHeader({ ...header, alg });
  return jwt.sign(new TextEncoder().encode(secret));
}
