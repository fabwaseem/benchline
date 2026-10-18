import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== "/mcp" || request.method !== "GET") return NextResponse.next();
  const accept = request.headers.get("accept") ?? "";
  const html = accept.indexOf("text/html");
  const stream = accept.indexOf("text/event-stream");
  if (html === -1 || (stream !== -1 && stream < html)) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/mcp/guide";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: "/mcp",
};
