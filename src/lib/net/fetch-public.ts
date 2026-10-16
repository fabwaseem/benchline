import { assertPublicHost, parsePublicHttpUrl, PublicUrlError } from "@/lib/net/ssrf";

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

function concat(chunks: Uint8Array[], total: number) {
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

export async function fetchPublic(
  input: string,
  init?: { accept?: string },
): Promise<PublicFetch> {
  let current = parsePublicHttpUrl(input);
  const redirects: string[] = [];
  const started = Date.now();

  for (let hop = 0; hop <= FETCH_LIMITS.maxRedirects; hop += 1) {
    await assertPublicHost(current);
    const response = await fetch(current, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_LIMITS.timeoutMs),
      headers: {
        accept: init?.accept ?? "text/html,application/xhtml+xml,text/plain,application/xml;q=0.9,*/*;q=0.5",
        "user-agent": "Toolsmith/1.0 (+https://tools.fabwaseem.com)",
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new PublicUrlError("Redirect was missing a location.");
      if (hop === FETCH_LIMITS.maxRedirects) throw new PublicUrlError("Too many redirects.");
      redirects.push(current.toString());
      current = parsePublicHttpUrl(new URL(location, current).toString());
      continue;
    }

    const reader = response.body?.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;
        total += value.byteLength;
        if (total > FETCH_LIMITS.maxBytes) {
          await reader.cancel();
          throw new PublicUrlError("Response is larger than 800 KB.");
        }
        chunks.push(value);
      }
    }
    const bytes = concat(chunks, total);
    return {
      url: current.toString(),
      status: response.status,
      contentType: response.headers.get("content-type") ?? "",
      text: new TextDecoder().decode(bytes),
      bytes: total,
      redirects,
      elapsedMs: Date.now() - started,
    };
  }

  throw new PublicUrlError("Too many redirects.");
}

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "local";
  return request.headers.get("x-real-ip") ?? "local";
}
