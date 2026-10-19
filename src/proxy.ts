import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hostnameFromHost, isMcpPath, LEGACY_HOST, legacyHostRedirect } from "@/lib/net/legacy-host";

function isAdminRoute(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/api/admin" || pathname.startsWith("/api/admin/");
}

function continueRequest(request: NextRequest) {
  const admin = isAdminRoute(request.nextUrl.pathname);
  if (!admin) return NextResponse.next();
  const headers = new Headers(request.headers);
  headers.set("x-benchline-admin", "1");
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("x-robots-tag", "noindex, nofollow");
  response.headers.set("cache-control", "private, no-store");
  return response;
}

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const host = request.headers.get("host");
  if (hostnameFromHost(host) === LEGACY_HOST && isMcpPath(url.pathname)) return NextResponse.next();
  const target = legacyHostRedirect(host, url.pathname, url.search);
  if (target) return NextResponse.redirect(target, 308);
  if (url.pathname !== "/mcp" || request.method !== "GET") return continueRequest(request);
  const accept = request.headers.get("accept") ?? "";
  const html = accept.indexOf("text/html");
  const stream = accept.indexOf("text/event-stream");
  if (html === -1 || (stream !== -1 && stream < html)) return continueRequest(request);
  const next = url.clone();
  next.pathname = "/mcp/guide";
  return NextResponse.rewrite(next);
}

export const config = {
  matcher: "/:path*",
};
