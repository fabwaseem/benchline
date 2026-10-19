import { ADMIN_COOKIE, ADMIN_MAX_AGE_SEC } from "@/lib/admin/config";
import { readCookie } from "@/lib/analytics/text";

export type AdminSession = {
  exp: number;
  csrf: string;
};

const hmac: HmacImportParams = { name: "HMAC", hash: "SHA-256" };

async function sign(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), hmac, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Buffer.from(new Uint8Array(mac)).toString("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

function randomCsrf(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

export async function issueSession(secret: string, now = Date.now()): Promise<{ token: string; session: AdminSession }> {
  const session: AdminSession = {
    exp: now + ADMIN_MAX_AGE_SEC * 1000,
    csrf: randomCsrf(),
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return { token: `${payload}.${await sign(payload, secret)}`, session };
}

export async function readSession(token: string | null | undefined, secret: string, now?: number): Promise<AdminSession | null> {
  if (!token || !secret) return null;
  const current = now ?? Date.now();
  const dot = token.indexOf(".");
  if (dot <= 0 || token.indexOf(".", dot + 1) !== -1) return null;
  const payload = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  if (!safeEqual(mac, await sign(payload, secret))) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const exp = (parsed as { exp?: unknown }).exp;
  const csrf = (parsed as { csrf?: unknown }).csrf;
  if (typeof exp !== "number" || !Number.isFinite(exp)) return null;
  if (typeof csrf !== "string" || csrf.length < 20 || csrf.length > 80) return null;
  if (exp <= current) return null;
  if (exp > current + ADMIN_MAX_AGE_SEC * 1000 + 60_000) return null;
  return { exp, csrf };
}

export async function sessionFromRequest(request: Request, secret: string, now?: number): Promise<AdminSession | null> {
  return readSession(readCookie(request.headers.get("cookie"), ADMIN_COOKIE), secret, now);
}

export function sessionCookie(token: string, maxAge = ADMIN_MAX_AGE_SEC): string {
  return `${ADMIN_COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

export function clearSessionCookie(): string {
  return `${ADMIN_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}
