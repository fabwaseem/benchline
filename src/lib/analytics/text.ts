import type { DeviceClass } from "@/lib/analytics/types";

export function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function cleanErrorCode(value: string | null | undefined): string | null {
  if (!value) return null;
  const code = value.trim().toLowerCase();
  if (!/^[a-z][a-z0-9_]{0,31}$/.test(code)) return null;
  return code;
}

export function cleanLabel(value: string | null | undefined, max = 64): string | null {
  if (!value) return null;
  const cleaned = value.replace(/[^\x20-\x7E]/g, "").trim().slice(0, max);
  return cleaned || null;
}

export function cleanProtocol(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$/.test(trimmed)) return trimmed;
  return null;
}

export function cleanId(value: string | null | undefined): string | null {
  if (!value) return null;
  const id = value.trim().toLowerCase();
  if (!/^[a-f0-9]{16,64}$/.test(id)) return null;
  return id;
}

export function cleanPath(value: string | null | undefined): string | null {
  if (!value) return null;
  const path = value.split("?")[0]?.split("#")[0] ?? "";
  if (!path.startsWith("/") || path.length > 200 || path.includes("..")) return null;
  if (!/^\/[A-Za-z0-9/_\-.]*$/.test(path)) return null;
  return path;
}

const UTM = /^[A-Za-z0-9._~-]{1,40}$/;

export function cleanUtm(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return UTM.test(trimmed) ? trimmed : null;
}

export function referrerHost(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    if (!host || host.length > 253 || host.includes(" ")) return null;
    return host;
  } catch {
    return null;
  }
}

export function sanitizeSearchQuery(value: string | null | undefined): string | null {
  if (!value) return null;
  const query = value.trim().replace(/\s+/g, " ").slice(0, 80);
  if (query.length < 2) return null;
  if (/https?:\/\//i.test(query) || /\bwww\./i.test(query)) return null;
  if (/^[a-z0-9_-]{8,}\.[a-z0-9_-]{8,}\.[a-z0-9_-]{8,}$/i.test(query)) return null;
  if (/^[A-Za-z0-9+/=_-]{40,}$/.test(query)) return null;
  return query;
}

export function cleanDeviceClass(value: string | null | undefined): DeviceClass | null {
  if (value === "mobile" || value === "tablet" || value === "desktop") return value;
  return null;
}

export function boundedInt(value: unknown, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const next = Math.round(value);
  if (next < 0 || next > max) return null;
  return next;
}

export function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(eq + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

export function uaFamily(userAgent: string | null | undefined): string | null {
  if (!userAgent) return null;
  const value = userAgent.toLowerCase();
  if (value.includes("edg/")) return "edge";
  if (value.includes("opr/") || value.includes("opera")) return "opera";
  if (value.includes("firefox/")) return "firefox";
  if (value.includes("chrome/") || value.includes("crios/")) return "chrome";
  if (value.includes("safari/")) return "safari";
  if (value.includes("curl/")) return "curl";
  if (value.includes("postman")) return "postman";
  if (value.includes("python-requests") || value.includes("python-httpx")) return "python";
  if (value.includes("go-http-client")) return "go";
  return "other";
}

export function deviceClassFromUa(userAgent: string | null | undefined): DeviceClass | null {
  if (!userAgent) return null;
  const value = userAgent.toLowerCase();
  if (value.includes("ipad") || value.includes("tablet")) return "tablet";
  if (value.includes("mobi") || value.includes("iphone") || value.includes("android")) return "mobile";
  return "desktop";
}

export function slugFromPathname(pathname: string): string | null {
  const match = /^\/t\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/.exec(pathname);
  return match?.[1] ?? null;
}
