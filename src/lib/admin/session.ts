import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { ADMIN_COOKIE, ADMIN_MAX_AGE_SEC } from "@/lib/admin/config";
import { readCookie } from "@/lib/analytics/text";

export type AdminSession = {
  exp: number;
  csrf: string;
};

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function issueSession(secret: string, now = Date.now()): { token: string; session: AdminSession } {
  const session: AdminSession = {
    exp: now + ADMIN_MAX_AGE_SEC * 1000,
    csrf: randomBytes(32).toString("base64url"),
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return { token: `${payload}.${sign(payload, secret)}`, session };
}

export function readSession(token: string | null | undefined, secret: string, now?: number): AdminSession | null {
  if (!token || !secret) return null;
  const current = now ?? Date.now();
  const dot = token.indexOf(".");
  if (dot <= 0 || token.indexOf(".", dot + 1) !== -1) return null;
  const payload = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  if (!safeEqual(mac, sign(payload, secret))) return null;
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

export function sessionFromRequest(request: Request, secret: string, now?: number): AdminSession | null {
  return readSession(readCookie(request.headers.get("cookie"), ADMIN_COOKIE), secret, now);
}

export function sessionCookie(token: string, maxAge = ADMIN_MAX_AGE_SEC): string {
  return `${ADMIN_COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

export function clearSessionCookie(): string {
  return `${ADMIN_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}
