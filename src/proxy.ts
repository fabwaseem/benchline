import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { legacyHostRedirect } from "@/lib/net/legacy-host";

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const target = legacyHostRedirect(request.headers.get("host"), url.pathname, url.search);
  if (target) return NextResponse.redirect(target, 308);
  if (url.pathname !== "/mcp" || request.method !== "GET") return NextResponse.next();
  const accept = request.headers.get("accept") ?? "";
  const html = accept.indexOf("text/html");
  const stream = accept.indexOf("text/event-stream");
  if (html === -1 || (stream !== -1 && stream < html)) return NextResponse.next();
  const next = url.clone();
  next.pathname = "/mcp/guide";
  return NextResponse.rewrite(next);
}

export const config = {
  matcher: "/:path*",
};
