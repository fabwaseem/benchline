import { sanitizeSearchQuery, slugFromPathname } from "@/lib/analytics/text";
import type { DeviceClass, RunOutcome } from "@/lib/analytics/types";

export type ClientRun = {
  slug?: string;
  outcome: RunOutcome;
  errorCode?: string;
  durationMs?: number;
  inputBytes?: number;
  outputBytes?: number;
};

type TrackBody = Record<string, unknown>;

const memory = new Map<string, string>();
let activeSlug: string | null = null;
let listener: ((event: ClientRun) => void) | null = null;
let suppressUntil = 0;
let searchTimer = 0;
let lastSearch = "";

function storageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

function storageSet(key: string, value: string) {
  memory.set(key, value);
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode */
  }
}

function hex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function mint(size: number): string {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return hex(bytes);
}

function writeCookie(name: string, value: string, maxAge: number) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

export function ensureIds(): { visitorId: string; sessionId: string } {
  const visitorId = storageGet("bl_vid") ?? mint(16);
  const seen = Number(storageGet("bl_sid_at") ?? "0");
  let sessionId = storageGet("bl_sid");
  if (!sessionId || !Number.isFinite(seen) || Date.now() - seen > 30 * 60 * 1000) sessionId = mint(16);
  storageSet("bl_vid", visitorId);
  storageSet("bl_sid", sessionId);
  storageSet("bl_sid_at", String(Date.now()));
  writeCookie("bl_vid", visitorId, 60 * 60 * 24 * 365);
  writeCookie("bl_sid", sessionId, 60 * 30);
  return { visitorId, sessionId };
}

export function deviceClass(): DeviceClass {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function recentlySent(key: string, windowMs: number): boolean {
  const last = Number(storageGet(key) ?? "0");
  if (Number.isFinite(last) && Date.now() - last < windowMs) return true;
  storageSet(key, String(Date.now()));
  return false;
}

export function sendTrack(body: TrackBody) {
  if (typeof window === "undefined") return;
  if (body.type === "page" && typeof body.path === "string" && recentlySent(`bl_page:${body.path}`, 1500)) return;
  if (body.type === "tool_open" && typeof body.slug === "string" && recentlySent(`bl_open:${body.slug}`, 1500)) return;
  const ids = ensureIds();
  const payload = JSON.stringify({ ...body, visitorId: ids.visitorId, sessionId: ids.sessionId });
  if (payload.length > 3500) return;
  const blob = new Blob([payload], { type: "application/json" });
  if (navigator.sendBeacon?.("/api/track", blob)) return;
  void fetch("/api/track", {
    method: "POST",
    body: payload,
    headers: { "content-type": "application/json" },
    keepalive: true,
  }).catch(() => undefined);
}

export function markToolSlug(slug: string | null) {
  activeSlug = slug;
}

export function activeToolSlug(): string | null {
  return activeSlug;
}

export function bindRunListener(next: (event: ClientRun) => void) {
  listener = next;
  return () => {
    if (listener === next) listener = null;
  };
}

export function markAccurateRun() {
  suppressUntil = Date.now() + 20_000;
}

export function heuristicSuppressed(): boolean {
  return Date.now() < suppressUntil;
}

export function emitRun(event: ClientRun) {
  markAccurateRun();
  if (listener) {
    listener(event);
    return;
  }
  const slug = event.slug ?? activeSlug;
  if (!slug) return;
  sendTrack({ type: "run", ...event, slug });
}

export function scheduleSearchTrack(query: string) {
  if (typeof window === "undefined") return;
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    const clean = sanitizeSearchQuery(query);
    if (!clean || clean === lastSearch) return;
    lastSearch = clean;
    sendTrack({ type: "search", query: clean });
  }, 800);
}

const TOOL_PATHS: Record<string, string> = {
  "/api/tools/html-markdown": "html-to-markdown-url",
  "/api/tools/http-headers": "http-headers-checker",
  "/api/tools/sitemap": "sitemap-validator",
  "/api/tools/ssl": "ssl-checker",
  "/api/tools/dns-lookup": "dns-lookup",
  "/api/tools/robots-txt": "robots-txt-checker",
  "/api/tools/ai-seo": "ai-seo-checker",
  "/api/tools/llms-txt": "llms-txt-generator",
  "/api/tools/meta-tags": "meta-tags-inspector",
};

export function slugForToolRequest(path: string): string | null {
  if (activeSlug) return activeSlug;
  return TOOL_PATHS[path] ?? null;
}

export function toolSlugFromLocation(pathname: string): string | null {
  return slugFromPathname(pathname);
}
