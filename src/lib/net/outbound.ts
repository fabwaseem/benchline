import { lookup } from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import type { LookupFunction } from "node:net";
import {
  assertPublicHostname,
  canonicalizeHost,
  isBlockedIp,
  isIpLiteral,
  parseOutboundUrl,
  PublicUrlError,
  type ParseOutboundOptions,
} from "@/lib/net/ssrf";

export type AddressRecord = { address: string; family: 4 | 6 };

export type HostLookup = (hostname: string) => Promise<AddressRecord[]>;

export type RedirectHop = { url: string; status: number; location: string };

export type OutboundResult = {
  url: string;
  status: number;
  headers: Headers;
  body: Uint8Array;
  redirects: RedirectHop[];
};

export type OutboundInit = ParseOutboundOptions & {
  method?: string;
  headers?: HeadersInit;
  body?: string | Uint8Array | null;
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  followRedirects?: boolean;
  redirectMessage?: string;
  discardBody?: boolean;
  signal?: AbortSignal;
  lookup?: HostLookup;
  tooLargeMessage?: string;
};

type DispatchInit = {
  method: string;
  headers: Headers;
  body: Uint8Array | null;
  signal: AbortSignal;
  timeoutMs: number;
  maxBytes: number;
  tooLargeMessage: string;
  discardBody: boolean;
};

type DispatchResult = { status: number; headers: Headers; body: Uint8Array };

const USER_AGENT = "Benchline/1.0 (+https://benchline.fabwaseem.com)";

async function defaultLookup(hostname: string): Promise<AddressRecord[]> {
  const records = await lookup(hostname, { all: true, verbatim: true });
  return records.map((record) => ({
    address: record.address,
    family: record.family === 6 ? 6 : 4,
  }));
}

export function pinLookup(addresses: AddressRecord[]): LookupFunction {
  const lookupFn: LookupFunction = (_hostname, options, callback) => {
    const first = addresses[0];
    if (!first) {
      callback(Object.assign(new Error("That host did not resolve."), { code: "ENOTFOUND" }), "", 4);
      return;
    }
    if ("all" in options && options.all) {
      callback(
        null,
        addresses.map((entry) => ({ address: entry.address, family: entry.family })),
      );
      return;
    }
    callback(null, first.address, first.family);
  };
  return lookupFn;
}

export async function resolvePublicHost(hostname: string, lookupFn: HostLookup = defaultLookup): Promise<AddressRecord[]> {
  const host = canonicalizeHost(hostname);
  assertPublicHostname(host);
  if (isIpLiteral(host)) return [{ address: host, family: host.includes(":") ? 6 : 4 }];
  let records: AddressRecord[];
  try {
    records = await lookupFn(host);
  } catch (error) {
    if (error instanceof PublicUrlError) throw error;
    throw new PublicUrlError("Could not resolve that host.");
  }
  if (records.length === 0) throw new PublicUrlError("Could not resolve that host.");
  for (const record of records) {
    if (!isIpLiteral(record.address) || isBlockedIp(record.address)) {
      throw new PublicUrlError("That host resolves to a private address.");
    }
  }
  return records.map((record) => ({ address: canonicalizeHost(record.address), family: record.family }));
}

export async function vetOutboundUrl(input: string, init: OutboundInit = {}) {
  const url = parseOutboundUrl(input, init);
  const addresses = await resolvePublicHost(url.hostname, init.lookup);
  return { url, addresses };
}

function requestHostname(url: URL): string {
  const host = url.hostname;
  if (host.startsWith("[") && host.endsWith("]")) return host.slice(1, -1);
  return host;
}

function sanitizeHeaders(headers: HeadersInit | undefined): Headers {
  const next = new Headers(headers);
  next.delete("host");
  next.delete("transfer-encoding");
  next.delete("content-length");
  if (!next.has("user-agent")) next.set("user-agent", USER_AGENT);
  next.set("accept-encoding", "identity");
  return next;
}

function headerRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

function toHeaders(raw: http.IncomingHttpHeaders): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") headers.append(key, value);
    else if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    }
  }
  return headers;
}

export function pinnedRequestOptions(url: URL, addresses: AddressRecord[], init: DispatchInit): https.RequestOptions {
  const hostname = requestHostname(url);
  const secure = url.protocol === "https:";
  return {
    protocol: url.protocol,
    hostname,
    port: url.port ? Number(url.port) : secure ? 443 : 80,
    method: init.method,
    path: `${url.pathname}${url.search}`,
    headers: headerRecord(init.headers),
    lookup: pinLookup(addresses),
    servername: secure && !isIpLiteral(hostname) ? hostname : undefined,
  };
}

function bodyBytes(body: string | Uint8Array | null | undefined): Uint8Array | null {
  if (body == null || body === "") return null;
  if (typeof body === "string") return new TextEncoder().encode(body);
  return body;
}

async function pinnedDispatch(url: URL, addresses: AddressRecord[], init: DispatchInit): Promise<DispatchResult> {
  const options = pinnedRequestOptions(url, addresses, init);
  const lib = url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      init.signal.removeEventListener("abort", onAbort);
      reject(error instanceof Error ? error : new Error("The request failed."));
    };
    const succeed = (value: DispatchResult) => {
      if (settled) return;
      settled = true;
      init.signal.removeEventListener("abort", onAbort);
      resolve(value);
    };
    if (init.signal.aborted) {
      fail(init.signal.reason instanceof Error ? init.signal.reason : new DOMException("aborted", "AbortError"));
      return;
    }
    const req = lib.request(options, (res) => {
      if (init.discardBody) {
        const status = res.statusCode ?? 0;
        const headers = toHeaders(res.headers);
        succeed({ status, headers, body: new Uint8Array() });
        res.destroy();
        return;
      }
      const declared = Number(res.headers["content-length"] ?? "");
      if (Number.isFinite(declared) && declared > init.maxBytes) {
        res.destroy();
        fail(new PublicUrlError(init.tooLargeMessage));
        return;
      }
      const chunks: Buffer[] = [];
      let total = 0;
      res.on("data", (chunk: Buffer) => {
        total += chunk.length;
        if (total > init.maxBytes) {
          res.destroy();
          fail(new PublicUrlError(init.tooLargeMessage));
          return;
        }
        chunks.push(chunk);
      });
      res.on("end", () => {
        succeed({ status: res.statusCode ?? 0, headers: toHeaders(res.headers), body: new Uint8Array(Buffer.concat(chunks)) });
      });
      res.on("error", fail);
    });
    const onAbort = () => {
      const reason = init.signal.reason;
      req.destroy(reason instanceof Error ? reason : new DOMException("aborted", "AbortError"));
    };
    init.signal.addEventListener("abort", onAbort, { once: true });
    req.setTimeout(init.timeoutMs, () => {
      req.destroy(new DOMException("The operation timed out.", "TimeoutError"));
    });
    req.on("error", fail);
    if (init.body) req.write(init.body);
    req.end();
  });
}

export const outboundTransport = {
  dispatch: pinnedDispatch,
};

export async function outboundFetch(input: string, init: OutboundInit = {}): Promise<OutboundResult> {
  const maxRedirects = init.maxRedirects ?? 4;
  const followRedirects = init.followRedirects !== false;
  const timeoutMs = init.timeoutMs ?? 8_000;
  const maxBytes = init.maxBytes ?? 800_000;
  const tooLargeMessage = init.tooLargeMessage ?? "Response is larger than 800 KB.";
  const policy: ParseOutboundOptions = {
    schemes: init.schemes,
    allowedPorts: init.allowedPorts,
    allowMissingScheme: init.allowMissingScheme,
  };
  let current = await vetOutboundUrl(input, { ...policy, lookup: init.lookup });
  const redirects: RedirectHop[] = [];
  const method = init.method ?? "GET";
  const headers = sanitizeHeaders(init.headers);
  const body = bodyBytes(init.body);

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const signal = init.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs);
    const response = await outboundTransport.dispatch(current.url, current.addresses, {
      method,
      headers,
      body: hop === 0 ? body : null,
      signal,
      timeoutMs,
      maxBytes,
      tooLargeMessage,
      discardBody: init.discardBody === true,
    });
    if (response.body.byteLength > maxBytes) throw new PublicUrlError(tooLargeMessage);
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!followRedirects) throw new PublicUrlError(init.redirectMessage ?? "Redirects are not followed.");
      if (!location) throw new PublicUrlError("Redirect was missing a location.");
      if (hop === maxRedirects) throw new PublicUrlError("Too many redirects.");
      redirects.push({ url: current.url.toString(), status: response.status, location });
      const next = new URL(location, current.url).toString();
      current = await vetOutboundUrl(next, { ...policy, allowMissingScheme: false, lookup: init.lookup });
      continue;
    }
    return {
      url: current.url.toString(),
      status: response.status,
      headers: response.headers,
      body: response.body,
      redirects,
    };
  }
  throw new PublicUrlError("Too many redirects.");
}
