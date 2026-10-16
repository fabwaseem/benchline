export type JwtClaims = Record<string, unknown>;

export type DecodedJwt = {
  token: string;
  header: JwtClaims;
  payload: JwtClaims;
  signature: string;
};

export type DecodeError = {
  error: string;
  kind: "malformed" | "jwe" | "json";
  segment?: 1 | 2 | 3;
  partialHeader?: JwtClaims;
  partialPayload?: JwtClaims;
};

export const EXAMPLE_SECRET = "benchline-example";

export const EXAMPLE_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZGEiLCJuYW1lIjoiQWRhIExvdmVsYWNlIiwicm9sZSI6Imluc3RydW1lbnQiLCJpc3MiOiJiZW5jaGxpbmUiLCJhdWQiOiJiZW5jaCIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxOTAwMDAwMDAwLCJqdGkiOiJleGFtcGxlIn0.Ups8wj1x8FyQauHBYCamwxB_nw4-RwJsrEny2mbp75Y";

const REGISTERED = ["iss", "sub", "aud", "exp", "nbf", "iat", "jti"] as const;
const DISPLAY_ORDER = ["iss", "sub", "aud", "iat", "nbf", "exp", "jti"] as const;

const CLAIM_LABEL: Record<string, string> = {
  iss: "Issuer",
  sub: "Subject",
  aud: "Audience",
  iat: "Issued",
  nbf: "Not before",
  exp: "Expires",
  jti: "Token ID",
};

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
  if (parts.length !== 3) {
    return { error: "A signed JWT has three base64url segments separated by dots.", kind: "malformed" };
  }
  const [headerPart, payloadPart, signature] = parts as [string, string, string];
  if (!headerPart || !payloadPart || !signature) {
    const segment = (!headerPart ? 1 : !payloadPart ? 2 : 3) as 1 | 2 | 3;
    let partialHeader: JwtClaims | undefined;
    if (segment !== 1 && headerPart) {
      try {
        partialHeader = readSegment(headerPart, 1);
      } catch {
        partialHeader = undefined;
      }
    }
    return { error: `Segment ${segment} is empty.`, kind: "malformed", segment, partialHeader };
  }
  let header: JwtClaims;
  try {
    header = readSegment(headerPart, 1);
  } catch (error) {
    return segmentFailure(error, 1);
  }
  let payload: JwtClaims;
  try {
    payload = readSegment(payloadPart, 2);
  } catch (error) {
    return { ...segmentFailure(error, 2), partialHeader: header };
  }
  if (!/^[A-Za-z0-9_-]+$/.test(signature)) {
    return {
      error: "Segment 3 isn’t valid base64url.",
      kind: "malformed",
      segment: 3,
      partialHeader: header,
      partialPayload: payload,
    };
  }
  return { token, header, payload, signature };
}

export function isDecoded(value: DecodedJwt | DecodeError): value is DecodedJwt {
  return "token" in value;
}

class SegmentError extends Error {
  kind: "json" | "malformed";

  constructor(message: string, kind: "json" | "malformed") {
    super(message);
    this.kind = kind;
  }
}

function readSegment(segment: string, index: 1 | 2): JwtClaims {
  if (!/^[A-Za-z0-9_-]+$/.test(segment)) {
    throw new SegmentError(`Segment ${index} isn’t valid base64url.`, "malformed");
  }
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(base64UrlToBytes(segment));
  } catch {
    throw new SegmentError(`Segment ${index} isn’t valid base64url.`, "malformed");
  }
  try {
    const value = JSON.parse(text) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new SegmentError(`Segment ${index} isn’t a JSON object.`, "json");
    }
    return value as JwtClaims;
  } catch (error) {
    if (error instanceof SegmentError) throw error;
    const detail = error instanceof Error ? error.message : "Unexpected token";
    throw new SegmentError(`Segment ${index} isn’t valid JSON. ${detail}`, "json");
  }
}

function segmentFailure(error: unknown, index: 1 | 2): DecodeError {
  if (error instanceof SegmentError) return { error: error.message, kind: error.kind, segment: index };
  return { error: `Segment ${index} isn’t valid JSON.`, kind: "json", segment: index };
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

export type ClaimView = {
  name: string;
  value: string;
  hint: string;
  sub?: string;
  tone?: "warn";
};

export function formatUtc(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("day")} ${pick("month")} ${pick("year")}, ${pick("hour")}:${pick("minute")} UTC`;
}

export function relativePhrase(date: Date, now = Date.now()) {
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const delta = date.getTime() - now;
  const abs = Math.abs(delta);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;
  if (abs < minute) return rtf.format(Math.round(delta / 1000), "second");
  if (abs < hour) return rtf.format(Math.round(delta / minute), "minute");
  if (abs < day) return rtf.format(Math.round(delta / hour), "hour");
  if (abs < month) return rtf.format(Math.round(delta / day), "day");
  if (abs < year) return rtf.format(Math.round(delta / month), "month");
  return rtf.format(Math.round(delta / year), "year");
}

export function claimViews(payload: JwtClaims, now = Date.now()): ClaimView[] {
  const ordered = [
    ...DISPLAY_ORDER.filter((name) => name in payload),
    ...Object.keys(payload).filter((name) => !(DISPLAY_ORDER as readonly string[]).includes(name)),
  ];
  return ordered.map((name) => {
    const raw = payload[name];
    if ((name === "exp" || name === "nbf" || name === "iat") && typeof raw === "number") {
      const date = new Date(raw * 1000);
      const past = date.getTime() < now;
      const tone = (name === "exp" && past) || (name === "nbf" && !past) ? ("warn" as const) : undefined;
      return { name, value: String(raw), hint: relativePhrase(date, now), sub: formatUtc(date), tone };
    }
    return { name, value: formatValue(raw), hint: CLAIM_LABEL[name] ?? "custom" };
  });
}

export type TimeNotice = { tone: "warn"; title: string; body: string };

export function timeNotices(payload: JwtClaims, now = Date.now()): TimeNotice[] {
  const notices: TimeNotice[] = [];
  if (!("exp" in payload)) {
    notices.push({ tone: "warn", title: "No exp claim.", body: "This token never expires." });
  }
  if (typeof payload.exp === "number" && payload.exp * 1000 < now) {
    const date = new Date(payload.exp * 1000);
    notices.push({
      tone: "warn",
      title: `Expired ${relativePhrase(date, now)}.`,
      body: `exp was ${formatUtc(date)}. An API will reject this token even though the signature is valid.`,
    });
  }
  if (typeof payload.nbf === "number" && payload.nbf * 1000 > now) {
    const date = new Date(payload.nbf * 1000);
    notices.push({
      tone: "warn",
      title: `Not valid until ${formatUtc(date)}.`,
      body: `nbf is ${relativePhrase(date, now)}.`,
    });
  }
  return notices;
}

function formatValue(value: unknown) {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

export function detectKey(secret: string): "" | "HMAC secret" | "PEM" | "JWK" | "JWKS" {
  const trimmed = secret.trim();
  if (!trimmed) return "";
  if (trimmed.includes("BEGIN")) return "PEM";
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as { keys?: unknown };
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.keys)) return "JWKS";
    } catch {
      return "JWK";
    }
    return "JWK";
  }
  return "HMAC secret";
}
