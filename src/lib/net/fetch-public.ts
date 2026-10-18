import { outboundFetch } from "@/lib/net/outbound";
import { WEB_PORTS } from "@/lib/net/ssrf";

export const FETCH_LIMITS = {
  timeoutMs: 8_000,
  maxRedirects: 4,
  maxBytes: 800_000,
};

export type PublicFetch = {
  url: string;
  status: number;
  contentType: string;
  text: string;
  bytes: number;
  redirects: string[];
  elapsedMs: number;
};

export async function fetchPublic(
  input: string,
  init?: { accept?: string },
): Promise<PublicFetch> {
  const started = Date.now();
  const response = await outboundFetch(input, {
    method: "GET",
    allowMissingScheme: true,
    allowedPorts: WEB_PORTS,
    timeoutMs: FETCH_LIMITS.timeoutMs,
    maxBytes: FETCH_LIMITS.maxBytes,
    maxRedirects: FETCH_LIMITS.maxRedirects,
    tooLargeMessage: "Response is larger than 800 KB.",
    headers: {
      accept: init?.accept ?? "text/html,application/xhtml+xml,text/plain,application/xml;q=0.9,*/*;q=0.5",
      "user-agent": "Benchline/1.0 (+https://tools.fabwaseem.com)",
    },
  });
  return {
    url: response.url,
    status: response.status,
    contentType: response.headers.get("content-type") ?? "",
    text: new TextDecoder().decode(response.body),
    bytes: response.body.byteLength,
    redirects: response.redirects.map((hop) => hop.url),
    elapsedMs: Date.now() - started,
  };
}

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "local";
  return request.headers.get("x-real-ip") ?? "local";
}
