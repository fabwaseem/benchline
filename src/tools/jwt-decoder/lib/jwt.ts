export type JwtClaims = Record<string, unknown>;

export type DecodedJwt = {
  token: string;
  header: JwtClaims;
  payload: JwtClaims;
  signature: string;
};

export type DecodeError = { error: string; kind: "malformed" | "jwe" | "json" };

const REGISTERED = ["iss", "sub", "aud", "exp", "nbf", "iat", "jti"] as const;

export function stripBearer(value: string) {
  return value.trim().replace(/^bearer\s+/i, "");
}

export function decodeJwt(raw: string): DecodedJwt | DecodeError {
  const token = stripBearer(raw);
  if (!token) return { error: "Paste a token.", kind: "malformed" };
  const parts = token.split(".");
  if (parts.length === 5) {
    return { error: "This is an encrypted JWE with five segments. This page only reads a signed JWT.", kind: "jwe" };
  }
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
    return { error: "A signed JWT has three base64url segments separated by dots.", kind: "malformed" };
  }
  const [headerPart, payloadPart, signature] = parts as [string, string, string];
  try {
    return {
      token,
      header: parseJson(headerPart),
      payload: parseJson(payloadPart),
      signature: signature ?? "",
    };
  } catch {
    return { error: "A segment is not valid JSON.", kind: "json" };
  }
}

export function isDecoded(value: DecodedJwt | DecodeError): value is DecodedJwt {
  return "header" in value;
}

function parseJson(segment: string): JwtClaims {
  const text = new TextDecoder().decode(base64UrlToBytes(segment));
  const value = JSON.parse(text) as unknown;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("json");
  return value as JwtClaims;
}

export function base64UrlToBytes(input: string) {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

export function claimRows(payload: JwtClaims, now = Date.now()) {
  return REGISTERED.flatMap((name) => {
    if (!(name in payload)) return [];
    const value = payload[name];
    return [{ name, value: formatClaim(name, value, now) }];
  });
}

function formatClaim(name: string, value: unknown, now: number) {
  if ((name === "exp" || name === "nbf" || name === "iat") && typeof value === "number") {
    const date = new Date(value * 1000);
    const relative = relativeTo(date, now);
    const utc = date.toISOString().replace(".000Z", "Z");
    if (name === "exp") {
      const state = date.getTime() < now ? `Expired ${relative}` : `Valid for ${relative}`;
      return `${state} · ${utc}`;
    }
    return `${relative} · ${utc}`;
  }
  if (Array.isArray(value)) return value.map(String).join(", ");
  return typeof value === "string" ? value : JSON.stringify(value);
}

export function relativeTo(date: Date, now: number) {
  const delta = Math.round((date.getTime() - now) / 1000);
  const abs = Math.abs(delta);
  const unit =
    abs < 60 ? "s" : abs < 3600 ? "m" : abs < 86400 ? "h" : "d";
  const amount =
    unit === "s" ? abs : unit === "m" ? Math.round(abs / 60) : unit === "h" ? Math.round(abs / 3600) : Math.round(abs / 86400);
  return delta < 0 ? `${amount}${unit} ago` : `${amount}${unit}`;
}

export function headerAlg(header: JwtClaims) {
  return typeof header.alg === "string" ? header.alg : "";
}
