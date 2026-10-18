import { countryFor } from "@/lib/analytics/country";
import { hashIp } from "@/lib/analytics/hash";
import { lookupCountry } from "@/lib/analytics/geodb";
import { analyticsIp } from "@/lib/analytics/ip";
import { readCookie, referrerHost, uaFamily, cleanId } from "@/lib/analytics/text";

export type RequestContext = {
  ipHash: string | null;
  country: string | null;
  uaFamily: string | null;
  referrerHost: string | null;
  visitorId: string | null;
  sessionId: string | null;
};

export function requestContext(request: Request, now = new Date()): RequestContext {
  const ip = analyticsIp(request);
  const salt = process.env.ANALYTICS_SALT ?? "";
  const cookie = request.headers.get("cookie");
  return {
    ipHash: ip ? hashIp(ip, salt, now) : null,
    country: countryFor(ip, request.headers, lookupCountry),
    uaFamily: uaFamily(request.headers.get("user-agent")),
    referrerHost: referrerHost(request.headers.get("referer")),
    visitorId: cleanId(readCookie(cookie, "bl_vid")),
    sessionId: cleanId(readCookie(cookie, "bl_sid")),
  };
}
