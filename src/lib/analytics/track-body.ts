import { isRegisteredSlug, parseSlug } from "@/lib/analytics/slug";
import {
  boundedInt,
  cleanDeviceClass,
  cleanErrorCode,
  cleanId,
  cleanPath,
  cleanUtm,
  referrerHost,
  sanitizeSearchQuery,
} from "@/lib/analytics/text";
import type { DeviceClass, RunOutcome, UiAction } from "@/lib/analytics/types";

export type TrackInput =
  | {
      type: "run";
      slug: string;
      outcome: RunOutcome;
      errorCode: string | null;
      durationMs: number | null;
      inputBytes: number | null;
      outputBytes: number | null;
      visitorId: string | null;
      sessionId: string | null;
    }
  | {
      type: "page";
      path: string;
      referrerHost: string | null;
      utmSource: string | null;
      utmMedium: string | null;
      utmCampaign: string | null;
      utmTerm: string | null;
      utmContent: string | null;
      deviceClass: DeviceClass | null;
      visitorId: string | null;
      sessionId: string | null;
    }
  | {
      type: "tool_open";
      slug: string;
      referrerHost: string | null;
      deviceClass: DeviceClass | null;
      visitorId: string | null;
      sessionId: string | null;
    }
  | { type: "search"; query: string; visitorId: string | null; sessionId: string | null }
  | { type: "action"; action: UiAction; slug: string | null; visitorId: string | null; sessionId: string | null };

function objectOf(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function text(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function ids(body: Record<string, unknown>) {
  return {
    visitorId: cleanId(text(body.visitorId)),
    sessionId: cleanId(text(body.sessionId)),
  };
}

export function parseTrackBody(value: unknown): TrackInput | "drop" | null {
  const body = objectOf(value);
  if (!body) return null;
  const type = body.type;
  const identity = ids(body);
  if (type === "run") {
    const slug = parseSlug(text(body.slug));
    if (!slug || !isRegisteredSlug(slug)) return null;
    const outcome = body.outcome;
    if (outcome !== "ok" && outcome !== "error" && outcome !== "rejected") return null;
    return {
      type: "run",
      slug,
      outcome,
      errorCode: cleanErrorCode(text(body.errorCode)),
      durationMs: boundedInt(body.durationMs, 600_000),
      inputBytes: boundedInt(body.inputBytes, 100_000_000),
      outputBytes: boundedInt(body.outputBytes, 100_000_000),
      ...identity,
    };
  }
  if (type === "page") {
    const path = cleanPath(text(body.path));
    if (!path) return null;
    return {
      type: "page",
      path,
      referrerHost: referrerHost(text(body.referrer)),
      utmSource: cleanUtm(text(body.utmSource)),
      utmMedium: cleanUtm(text(body.utmMedium)),
      utmCampaign: cleanUtm(text(body.utmCampaign)),
      utmTerm: cleanUtm(text(body.utmTerm)),
      utmContent: cleanUtm(text(body.utmContent)),
      deviceClass: cleanDeviceClass(text(body.deviceClass)),
      ...identity,
    };
  }
  if (type === "tool_open") {
    const slug = parseSlug(text(body.slug));
    if (!slug || !isRegisteredSlug(slug)) return null;
    return {
      type: "tool_open",
      slug,
      referrerHost: referrerHost(text(body.referrer)),
      deviceClass: cleanDeviceClass(text(body.deviceClass)),
      ...identity,
    };
  }
  if (type === "search") {
    const query = sanitizeSearchQuery(text(body.query));
    if (!query) return "drop";
    return { type: "search", query, ...identity };
  }
  if (type === "action") {
    if (body.action !== "copy" && body.action !== "download") return null;
    const slugRaw = text(body.slug);
    const slug = slugRaw ? parseSlug(slugRaw) : null;
    if (slugRaw && (!slug || !isRegisteredSlug(slug))) return null;
    return { type: "action", action: body.action, slug, ...identity };
  }
  return null;
}
