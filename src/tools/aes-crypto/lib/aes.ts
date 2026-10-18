import { decodeBase64, encodeBase64 } from "@/lib/base64";

// AES-GCM encrypt/decrypt over the platform WebCrypto (globalThis.crypto.subtle),
// which works in browsers and in Node 18+. Keys come from PBKDF2-SHA256 over a
// passphrase with a random 16-byte salt; each encryption uses a random 12-byte IV.

export const AES_ITERATIONS_MIN = 10_000;
export const AES_ITERATIONS_MAX = 2_000_000;
export const AES_ITERATIONS_DEFAULT = 100_000;

export type AesBundle = {
  v: 1;
  iter: number;
  salt: string;
  iv: string;
  ct: string;
};

function subtle(): SubtleCrypto {
  const cryptoObject = globalThis.crypto;
  if (!cryptoObject?.subtle) throw new Error("WebCrypto is not available in this environment.");
  return cryptoObject.subtle;
}

function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

/** Copies bytes into a fresh ArrayBuffer-backed view for WebCrypto's BufferSource. */
function toBytes(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(bytes.length);
  out.set(bytes);
  return out;
}

function checkIterations(iterations: number): string {
  if (!Number.isInteger(iterations) || iterations < AES_ITERATIONS_MIN || iterations > AES_ITERATIONS_MAX) {
    return `Iterations must be between ${AES_ITERATIONS_MIN.toLocaleString()} and ${AES_ITERATIONS_MAX.toLocaleString()}.`;
  }
  return "";
}

export async function deriveKey(passphrase: string, salt: Uint8Array, iterations: number): Promise<CryptoKey | { error: string }> {
  if (!passphrase) return { error: "Enter a passphrase." };
  const iterationError = checkIterations(iterations);
  if (iterationError) return { error: iterationError };
  const material = await subtle().importKey("raw", toBytes(new TextEncoder().encode(passphrase)), "PBKDF2", false, ["deriveKey"]);
  return subtle().deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: toBytes(salt), iterations },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/** Encrypts text. Returns a base64 bundle holding version, iterations, salt, IV, and ciphertext. */
export async function encryptText(
  plaintext: string,
  passphrase: string,
  iterations: number = AES_ITERATIONS_DEFAULT,
): Promise<{ bundle: string; bundleJson: AesBundle } | { error: string }> {
  if (!plaintext) return { error: "Enter text to encrypt." };
  const salt = randomBytes(16);
  const key = await deriveKey(passphrase, salt, iterations);
  if ("error" in key) return key;
  const iv = randomBytes(12);
  const ciphertext = new Uint8Array(
    await subtle().encrypt({ name: "AES-GCM", iv }, key, toBytes(new TextEncoder().encode(plaintext))),
  );
  const bundleJson: AesBundle = {
    v: 1,
    iter: iterations,
    salt: encodeBase64(salt),
    iv: encodeBase64(iv),
    ct: encodeBase64(ciphertext),
  };
  return { bundle: encodeBase64(new TextEncoder().encode(JSON.stringify(bundleJson))), bundleJson };
}

function parseBundle(bundle: string): AesBundle | { error: string } {
  let bytes: Uint8Array;
  try {
    bytes = decodeBase64(bundle, "Bundle");
  } catch (error) {
    return { error: error instanceof Error ? error.message : "The bundle is not valid base64." };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    return { error: "The bundle is not valid JSON." };
  }
  if (!parsed || typeof parsed !== "object") return { error: "The bundle is malformed." };
  const record = parsed as Record<string, unknown>;
  if (record.v !== 1) return { error: "Unsupported bundle version." };
  if (
    typeof record.iter !== "number" ||
    typeof record.salt !== "string" ||
    typeof record.iv !== "string" ||
    typeof record.ct !== "string"
  ) {
    return { error: "The bundle is missing fields." };
  }
  return { v: 1, iter: record.iter, salt: record.salt, iv: record.iv, ct: record.ct };
}

/** Decrypts a bundle. A wrong passphrase or tampered data returns an error, never partial output. */
export async function decryptBundle(bundle: string, passphrase: string): Promise<{ plaintext: string } | { error: string }> {
  const parsed = parseBundle(bundle);
  if ("error" in parsed) return parsed;
  let salt: Uint8Array;
  let iv: Uint8Array;
  let ct: Uint8Array;
  try {
    salt = decodeBase64(parsed.salt, "Salt");
    iv = decodeBase64(parsed.iv, "IV");
    ct = decodeBase64(parsed.ct, "Ciphertext");
  } catch (error) {
    return { error: error instanceof Error ? error.message : "The bundle fields are not valid base64." };
  }
  const key = await deriveKey(passphrase, salt, parsed.iter);
  if ("error" in key) return key;
  try {
    const plaintext = await subtle().decrypt({ name: "AES-GCM", iv: toBytes(iv) }, key, toBytes(ct));
    return { plaintext: new TextDecoder().decode(plaintext) };
  } catch {
    return { error: "Decryption failed. The passphrase is wrong or the data was tampered with." };
  }
}
