import { FETCH_LIMITS } from "@/lib/net/fetch-public";
import { outboundFetch } from "@/lib/net/outbound";
import { WEB_PORTS } from "@/lib/net/ssrf";

export type HeaderField = { name: string; value: string };

export type RedirectHop = {
  url: string;
  status: number;
  location: string;
};

export type Exchange = {
  url: string;
  status: number;
  headers: HeaderField[];
  body: string;
  bytes: number;
  redirects: RedirectHop[];
  elapsedMs: number;
};

function headerList(headers: Headers): HeaderField[] {
  return [...headers.entries()].map(([name, value]) => ({ name, value }));
}

export async function fetchExchange(
  input: string,
  init?: { accept?: string; readBody?: boolean; maxBytes?: number },
): Promise<Exchange> {
  const read = init?.readBody !== false;
  const maxBytes = init?.maxBytes ?? FETCH_LIMITS.maxBytes;
  const started = Date.now();
  const response = await outboundFetch(input, {
    method: "GET",
    allowMissingScheme: true,
    allowedPorts: WEB_PORTS,
    timeoutMs: FETCH_LIMITS.timeoutMs,
    maxBytes,
    maxRedirects: FETCH_LIMITS.maxRedirects,
    discardBody: !read,
    tooLargeMessage: "Response is larger than 800 KB.",
    headers: {
      accept: init?.accept ?? "*/*",
      "user-agent": "Benchline/1.0 (+https://benchline.fabwaseem.com)",
    },
  });
  return {
    url: response.url,
    status: response.status,
    headers: headerList(response.headers),
    body: read ? new TextDecoder().decode(response.body) : "",
    bytes: read ? response.body.byteLength : 0,
    redirects: response.redirects,
    elapsedMs: Date.now() - started,
  };
}
