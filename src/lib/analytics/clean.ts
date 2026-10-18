import { ZodError } from "zod";
import { PublicUrlError } from "@/lib/net/ssrf";
import { cleanErrorCode } from "@/lib/analytics/text";
import type { RunOutcome } from "@/lib/analytics/types";

export {
  boundedInt,
  cleanDeviceClass,
  cleanErrorCode,
  cleanId,
  cleanLabel,
  cleanPath,
  cleanProtocol,
  cleanUtm,
  deviceClassFromUa,
  readCookie,
  referrerHost,
  sanitizeSearchQuery,
  slugFromPathname,
  uaFamily,
  utcDay,
} from "@/lib/analytics/text";

export function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : "error";
  return message.replace(/postgres(?:ql)?:\/\/\S+/gi, "postgres://redacted").slice(0, 300);
}

export function classifyError(error: unknown): { outcome: Extract<RunOutcome, "error" | "rejected">; errorCode: string } {
  if (error instanceof ZodError) return { outcome: "rejected", errorCode: "validation" };
  if (error instanceof PublicUrlError || (error instanceof Error && error.name === "PublicUrlError")) {
    return { outcome: "rejected", errorCode: "public_url" };
  }
  if (error instanceof Error && error.name === "TimeoutError") return { outcome: "error", errorCode: "timeout" };
  const named = error instanceof Error ? cleanErrorCode(error.name) : null;
  if (named && named !== "error") return { outcome: "error", errorCode: named };
  return { outcome: "error", errorCode: "error" };
}

export function byteSize(value: unknown, depth = 0): number | null {
  if (depth > 6) return null;
  try {
    if (typeof value === "string") return Buffer.byteLength(value);
    if (typeof value === "number" || typeof value === "boolean" || value === null || value === undefined) return 0;
    if (value instanceof Uint8Array) return value.byteLength;
    if (Array.isArray(value)) {
      let total = 0;
      for (const item of value) {
        const next = byteSize(item, depth + 1);
        if (next === null) return null;
        total += next;
        if (total > 50_000_000) return 50_000_000;
      }
      return total;
    }
    if (typeof value === "object") {
      let total = 0;
      for (const [key, item] of Object.entries(value)) {
        total += Buffer.byteLength(key);
        const next = byteSize(item, depth + 1);
        if (next === null) return null;
        total += next;
        if (total > 50_000_000) return 50_000_000;
      }
      return total;
    }
    return null;
  } catch {
    return null;
  }
}
