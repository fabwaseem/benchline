import { NextResponse, type NextRequest } from "next/server";
import { legacyHostRedirect } from "@/lib/net/legacy-host";

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const target = legacyHostRedirect(request.headers.get("host"), url.pathname, url.search);
  if (!target) return NextResponse.next();
  return NextResponse.redirect(target, 308);
}

export const config = {
  matcher: "/:path*",
};
