import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminEnv } from "@/lib/admin/config";
import { sessionFromRequest } from "@/lib/admin/session";
import { isAdminPath } from "@/lib/analytics/text";
import { hostnameFromHost, isHealthPath, isMcpPath, LEGACY_HOST, legacyHostRedirect } from "@/lib/net/legacy-host";

function isAdminRoute(pathname: string): boolean {
  return isAdminPath(pathname) || pathname === "/api/admin" || pathname.startsWith("/api/admin/");
}

function isLoginPage(pathname: string): boolean {
  return pathname === "/admin/login" || pathname === "/admin/login/";
}

function seal(response: NextResponse): NextResponse {
  response.headers.set("x-robots-tag", "noindex, nofollow");
  response.headers.set("cache-control", "private, no-store");
  return response;
}

function nextAdmin(request: NextRequest): NextResponse {
  const headers = new Headers(request.headers);
  headers.set("x-benchline-admin", "1");
  return seal(NextResponse.next({ request: { headers } }));
}

async function continueRequest(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  if (isAdminPath(pathname)) {
    const env = adminEnv();
    if (!env) return seal(new NextResponse(null, { status: 404 }));
    if (!isLoginPage(pathname)) {
      const session = await sessionFromRequest(request, env.secret);
      if (!session) {
        const login = request.nextUrl.clone();
        login.pathname = "/admin/login";
        login.search = "";
        const status = request.method === "GET" || request.method === "HEAD" ? 307 : 303;
        return seal(NextResponse.redirect(login, status));
      }
    }
  }
  if (!isAdminRoute(pathname)) return NextResponse.next();
  return nextAdmin(request);
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl;
  if (isHealthPath(url.pathname)) return NextResponse.next();
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
