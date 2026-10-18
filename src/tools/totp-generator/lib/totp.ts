// Pure TOTP/HOTP implementation per RFC 4226 and RFC 6238.
// Uses the platform WebCrypto (globalThis.crypto.subtle), which works in
// browsers and in Node 18+. Secrets are RFC 4648 base32.

export const TOTP_ALGORITHMS = ["SHA1", "SHA256", "SHA512"] as const;
export type TotpAlgorithm = (typeof TOTP_ALGORITHMS)[number];

export const TOTP_DIGITS = [6, 8] as const;
export type TotpDigits = (typeof TOTP_DIGITS)[number];

export type TotpOptions = {
  digits: TotpDigits;
  period: number;
  algorithm: TotpAlgorithm;
};

export type HotpOptions = {
  digits: TotpDigits;
  algorithm: TotpAlgorithm;
};

export type TotpAccount = {
  id: string;
  label: string;
  issuer: string;
  secret: string;
  digits: TotpDigits;
  period: number;
  algorithm: TotpAlgorithm;
  mode: "totp" | "hotp";
  counter: number;
};

export type TotpResult = {
  code: string;
  secondsRemaining: number;
  period: number;
};

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const BASE32_LOOKUP = new Map<string, number>(
  [...BASE32_ALPHABET].map((char, index) => [char, index]),
);

const SUBTLE_ALGORITHM: Record<TotpAlgorithm, string> = {
  SHA1: "SHA-1",
  SHA256: "SHA-256",
  SHA512: "SHA-512",
};

function subtle(): SubtleCrypto {
  const cryptoObject = globalThis.crypto;
  if (!cryptoObject?.subtle) throw new Error("WebCrypto is not available in this environment.");
  return cryptoObject.subtle;
}

export function normalizeSecret(secret: string): string {
  return secret.trim().replace(/[\s-]/g, "").toUpperCase();
}

export function decodeBase32(secret: string): Uint8Array<ArrayBuffer> | { error: string } {
  const clean = normalizeSecret(secret).replace(/=+$/, "");
  if (clean.length === 0) return { error: "The secret is empty." };
  if (clean.length % 8 === 1) return { error: "The secret is not valid base32." };
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of clean) {
    const value = BASE32_LOOKUP.get(char);
    if (value === undefined) return { error: `The secret contains an invalid base32 character: ${char}.` };
    buffer = (buffer << 5) | value;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  if (bytes.length === 0) return { error: "The secret is not valid base32." };
  const out = new Uint8Array(bytes.length);
  out.set(bytes);
  return out;
}

function validateOptions(digits: number, algorithm: string): TotpAlgorithm | { error: string } {
  if (digits !== 6 && digits !== 8) return { error: "Digits must be 6 or 8." };
  if (!TOTP_ALGORITHMS.includes(algorithm as TotpAlgorithm)) {
    return { error: "Algorithm must be SHA1, SHA256, or SHA512." };
  }
  return algorithm as TotpAlgorithm;
}

async function hotpRaw(key: Uint8Array<ArrayBuffer>, counter: bigint, digits: TotpDigits, algorithm: TotpAlgorithm): Promise<string> {
  const message = new Uint8Array(8);
  const view = new DataView(message.buffer);
  view.setBigUint64(0, counter);
  const cryptoKey = await subtle().importKey("raw", key, { name: "HMAC", hash: SUBTLE_ALGORITHM[algorithm] }, false, ["sign"]);
  const signature = new Uint8Array(await subtle().sign("HMAC", cryptoKey, message));
  const offset = (signature[signature.length - 1] ?? 0) & 0x0f;
  const code =
    (((signature[offset] ?? 0) & 0x7f) << 24) |
    (((signature[offset + 1] ?? 0) & 0xff) << 16) |
    (((signature[offset + 2] ?? 0) & 0xff) << 8) |
    ((signature[offset + 3] ?? 0) & 0xff);
  return String(code % 10 ** digits).padStart(digits, "0");
}

/** HOTP code for a raw key. Counter must be a non-negative integer. */
export async function hotpCode(
  key: Uint8Array<ArrayBuffer>,
  counter: number,
  options: HotpOptions,
): Promise<string | { error: string }> {
  const validated = validateOptions(options.digits, options.algorithm);
  if (typeof validated !== "string") return validated;
  if (!Number.isInteger(counter) || counter < 0) return { error: "The HOTP counter must be a non-negative integer." };
  return hotpRaw(key, BigInt(counter), options.digits, validated);
}

/** TOTP code for a raw key at a given time. */
export async function totpCode(
  key: Uint8Array<ArrayBuffer>,
  options: TotpOptions,
  atMs: number = Date.now(),
): Promise<TotpResult | { error: string }> {
  const validated = validateOptions(options.digits, options.algorithm);
  if (typeof validated !== "string") return validated;
  if (!Number.isInteger(options.period) || options.period <= 0) {
    return { error: "The period must be a positive number of seconds." };
  }
  const seconds = Math.floor(atMs / 1000);
  const counter = Math.floor(seconds / options.period);
  const code = await hotpRaw(key, BigInt(counter), options.digits, validated);
  const secondsRemaining = options.period - (seconds % options.period);
  return { code, secondsRemaining, period: options.period };
}

/** TOTP code for a base32 secret at a given time. */
export async function generateTotp(
  secret: string,
  options: TotpOptions,
  atMs: number = Date.now(),
): Promise<TotpResult | { error: string }> {
  const key = decodeBase32(secret);
  if ("error" in key) return key;
  return totpCode(key, options, atMs);
}

/** HOTP code for a base32 secret. */
export async function generateHotp(
  secret: string,
  counter: number,
  options: HotpOptions,
): Promise<string | { error: string }> {
  const key = decodeBase32(secret);
  if ("error" in key) return key;
  return hotpCode(key, counter, options);
}

function encodeLabel(label: string, issuer: string): string {
  const prefix = issuer ? `${issuer}:` : "";
  return encodeURIComponent(`${prefix}${label}`);
}

export function buildOtpAuthUri(account: Pick<TotpAccount, "label" | "issuer" | "secret" | "digits" | "period" | "algorithm" | "mode" | "counter">): string {
  const params = new URLSearchParams({
    secret: normalizeSecret(account.secret).replace(/=+$/, ""),
    digits: String(account.digits),
    algorithm: account.algorithm,
  });
  if (account.issuer) params.set("issuer", account.issuer);
  if (account.mode === "totp") {
    params.set("period", String(account.period));
  } else {
    params.set("counter", String(account.counter));
  }
  return `otpauth://${account.mode}/${encodeLabel(account.label, account.issuer)}?${params.toString()}`;
}

export function parseOtpAuthUri(uri: string): Omit<TotpAccount, "id"> | { error: string } {
  let parsed: URL;
  try {
    parsed = new URL(uri.trim());
  } catch {
    return { error: "That is not a valid otpauth:// URI." };
  }
  if (parsed.protocol !== "otpauth:") return { error: "The URI must start with otpauth://." };
  const mode = parsed.hostname.toLowerCase();
  if (mode !== "totp" && mode !== "hotp") return { error: "The URI must be a totp or hotp URI." };
  const secret = parsed.searchParams.get("secret") ?? "";
  const key = decodeBase32(secret);
  if ("error" in key) return { error: `The URI secret is invalid: ${key.error}` };
  const rawLabel = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  const issuerParam = parsed.searchParams.get("issuer") ?? "";
  let label = rawLabel;
  let issuer = issuerParam;
  const colon = rawLabel.indexOf(":");
  if (colon >= 0) {
    const prefix = rawLabel.slice(0, colon);
    label = rawLabel.slice(colon + 1);
    if (!issuer) issuer = prefix;
  }
  const digits = Number(parsed.searchParams.get("digits") ?? "6");
  const algorithm = (parsed.searchParams.get("algorithm") ?? "SHA1").toUpperCase();
  const period = Number(parsed.searchParams.get("period") ?? "30");
  const counter = Number(parsed.searchParams.get("counter") ?? "0");
  if (!label) return { error: "The URI is missing an account label." };
  if (digits !== 6 && digits !== 8) return { error: "The URI digits must be 6 or 8." };
  if (!TOTP_ALGORITHMS.includes(algorithm as TotpAlgorithm)) {
    return { error: "The URI algorithm must be SHA1, SHA256, or SHA512." };
  }
  if (mode === "totp" && (!Number.isInteger(period) || period <= 0)) {
    return { error: "The URI period must be a positive number of seconds." };
  }
  if (mode === "hotp" && (!Number.isInteger(counter) || counter < 0)) {
    return { error: "The URI counter must be a non-negative integer." };
  }
  return {
    label,
    issuer,
    secret: normalizeSecret(secret),
    digits: digits as TotpDigits,
    period: mode === "totp" ? period : 30,
    algorithm: algorithm as TotpAlgorithm,
    mode,
    counter: mode === "hotp" ? counter : 0,
  };
}

export function groupCode(code: string): string {
  return code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code;
}
