import { createHash } from "node:crypto";
import { utcDay } from "@/lib/analytics/text";

/** Daily hash of salt, UTC date, and IP. Raw addresses are not returned. */
export function hashIp(ip: string, salt: string, now = new Date()): string | null {
  const trimmed = ip.trim();
  if (!salt || !trimmed) return null;
  const day = utcDay(now);
  return createHash("sha256").update(`${salt}|${day}|${trimmed}`).digest("hex");
}

/** Opaque session key. Printable tokens are kept; anything else is hashed. */
export function sessionKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 200) return null;
  if (/^[A-Za-z0-9_-]{1,128}$/.test(trimmed)) return trimmed;
  return createHash("sha256").update(trimmed).digest("hex");
}
