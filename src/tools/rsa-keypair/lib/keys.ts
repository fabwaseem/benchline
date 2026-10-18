import {
  calculateJwkThumbprint,
  exportJWK,
  exportPKCS8,
  exportSPKI,
  generateKeyPair,
  importJWK,
  importPKCS8,
  importSPKI,
  type JWK,
} from "jose";

export const keyAlgorithms = ["RS256", "RS384", "RS512", "PS256", "ES256", "ES384", "ES512", "Ed25519"] as const;
export type KeyAlgorithm = (typeof keyAlgorithms)[number];

export type KeyMaterial = {
  alg: KeyAlgorithm;
  publicPem: string;
  privatePem: string;
  publicJwk: string;
  privateJwk: string;
  jwks: string;
};

const PRIVATE_FIELDS = new Set(["d", "p", "q", "dp", "dq", "qi", "k"]);

export function isKeyAlgorithm(value: string): value is KeyAlgorithm {
  return (keyAlgorithms as readonly string[]).includes(value);
}

export async function generateMaterial(alg: KeyAlgorithm, modulusLength: 2048 | 4096 = 2048): Promise<KeyMaterial> {
  const rsa = alg.startsWith("RS") || alg.startsWith("PS");
  const pair = await generateKeyPair(alg, {
    extractable: true,
    modulusLength: rsa ? modulusLength : undefined,
  });
  return materialFromKeys(alg, pair.publicKey, pair.privateKey);
}

export async function pemToMaterial(pem: string, alg: KeyAlgorithm): Promise<KeyMaterial | { error: string }> {
  const trimmed = pem.trim();
  if (!trimmed.includes("-----BEGIN")) return { error: "Paste a PEM block." };
  try {
    if (/PRIVATE KEY/.test(trimmed)) {
      const privateKey = await importPKCS8(trimmed, alg, { extractable: true });
      const privateJwk = await decorate(await exportJWK(privateKey), alg);
      const publicJwk = publicOnly(privateJwk);
      const publicKey = await importJWK(publicJwk, alg, { extractable: true });
      if (publicKey instanceof Uint8Array) return { error: "That PEM is not an asymmetric key." };
      const publicPem = await exportSPKI(publicKey);
      return pack(alg, publicPem, trimmed.endsWith("\n") ? trimmed : `${trimmed}\n`, publicJwk, privateJwk);
    }
    const publicKey = await importSPKI(trimmed, alg, { extractable: true });
    const publicJwk = await decorate(await exportJWK(publicKey), alg);
    const publicPem = await exportSPKI(publicKey);
    return pack(alg, publicPem, "", publicJwk, null);
  } catch {
    return { error: "That PEM could not be read for this algorithm." };
  }
}

export async function jwkToMaterial(text: string, alg: KeyAlgorithm): Promise<KeyMaterial | { error: string }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: "Paste a JSON Web Key." };
  }
  const jwk = unwrapJwk(parsed);
  if (!jwk) return { error: "Paste a JWK object, or a JWKS with one key." };
  try {
    const key = await importJWK(jwk, alg, { extractable: true });
    if (key instanceof Uint8Array) return { error: "Symmetric keys are not converted here." };
    if (jwk.d) {
      const privateJwk = await decorate(await exportJWK(key), alg);
      const publicJwk = publicOnly(privateJwk);
      const publicKey = await importJWK(publicJwk, alg, { extractable: true });
      if (publicKey instanceof Uint8Array) return { error: "That JWK is not an asymmetric key." };
      return pack(alg, await exportSPKI(publicKey), await exportPKCS8(key), publicJwk, privateJwk);
    }
    const publicJwk = await decorate(await exportJWK(key), alg);
    return pack(alg, await exportSPKI(key), "", publicJwk, null);
  } catch {
    return { error: "That JWK could not be read for this algorithm." };
  }
}

async function materialFromKeys(alg: KeyAlgorithm, publicKey: CryptoKey, privateKey: CryptoKey): Promise<KeyMaterial> {
  const publicJwk = await decorate(await exportJWK(publicKey), alg);
  const privateJwk = await decorate(await exportJWK(privateKey), alg);
  privateJwk.kid = publicJwk.kid;
  return pack(alg, await exportSPKI(publicKey), await exportPKCS8(privateKey), publicJwk, privateJwk);
}

async function decorate(jwk: JWK, alg: KeyAlgorithm) {
  const next: JWK = { ...jwk, alg: alg === "Ed25519" ? "EdDSA" : alg, use: "sig" };
  const thumb = await calculateJwkThumbprint(publicOnly(next));
  next.kid = thumb;
  return next;
}

function publicOnly(jwk: JWK): JWK {
  const next: JWK = {};
  for (const [key, value] of Object.entries(jwk)) {
    if (PRIVATE_FIELDS.has(key) || value === undefined) continue;
    next[key as keyof JWK] = value as never;
  }
  return next;
}

function pack(alg: KeyAlgorithm, publicPem: string, privatePem: string, publicJwk: JWK, privateJwk: JWK | null): KeyMaterial {
  const publicText = JSON.stringify(publicJwk, null, 2);
  const privateText = privateJwk ? JSON.stringify(privateJwk, null, 2) : "";
  return {
    alg,
    publicPem,
    privatePem,
    publicJwk: publicText,
    privateJwk: privateText,
    jwks: JSON.stringify({ keys: [publicJwk] }, null, 2),
  };
}

function unwrapJwk(value: unknown): JWK | null {
  if (!value || typeof value !== "object") return null;
  if ("keys" in value && Array.isArray(value.keys)) {
    const first = value.keys[0];
    return first && typeof first === "object" ? (first as JWK) : null;
  }
  if ("kty" in value) return value as JWK;
  return null;
}
