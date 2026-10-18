import { FETCH_LIMITS } from "@/lib/net/fetch-public";
import { assertPublicHost, parsePublicHttpUrl, PublicUrlError } from "@/lib/net/ssrf";

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

async function readBody(response: Response, maxBytes: number) {
  const reader = response.body?.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  if (!reader) return { text: "", bytes: 0 };
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new PublicUrlError("Response is larger than 800 KB.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { text: new TextDecoder().decode(bytes), bytes: total };
}

export async function fetchExchange(
  input: string,
  init?: { accept?: string; readBody?: boolean; maxBytes?: number },
): Promise<Exchange> {
  const read = init?.readBody !== false;
  const maxBytes = init?.maxBytes ?? FETCH_LIMITS.maxBytes;
  let current = parsePublicHttpUrl(input);
  const redirects: RedirectHop[] = [];
  const started = Date.now();

  for (let hop = 0; hop <= FETCH_LIMITS.maxRedirects; hop += 1) {
    await assertPublicHost(current);
    const response = await fetch(current, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_LIMITS.timeoutMs),
      headers: {
        accept: init?.accept ?? "*/*",
        "user-agent": "Benchline/1.0 (+https://tools.fabwaseem.com)",
      },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location) throw new PublicUrlError("Redirect was missing a location.");
      if (hop === FETCH_LIMITS.maxRedirects) throw new PublicUrlError("Too many redirects.");
      redirects.push({ url: current.toString(), status: response.status, location });
      current = parsePublicHttpUrl(new URL(location, current).toString());
      continue;
    }
    const headers = headerList(response.headers);
    if (!read) {
      await response.body?.cancel();
      return {
        url: current.toString(),
        status: response.status,
        headers,
        body: "",
        bytes: 0,
        redirects,
        elapsedMs: Date.now() - started,
      };
    }
    const body = await readBody(response, maxBytes);
    return {
      url: current.toString(),
      status: response.status,
      headers,
      body: body.text,
      bytes: body.bytes,
      redirects,
      elapsedMs: Date.now() - started,
    };
  }

  throw new PublicUrlError("Too many redirects.");
}
