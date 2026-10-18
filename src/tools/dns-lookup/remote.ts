import { FETCH_LIMITS } from "@/lib/net/fetch-public";
import { assertPublicHost, parsePublicHttpUrl, PublicUrlError } from "@/lib/net/ssrf";
import {
  dmarcName,
  parseDmarc,
  parseDoh,
  parseSpf,
  recordTypes,
  resolverEndpoints,
  validateName,
  type DnsQueryResult,
  type DnsRecord,
  type RecordType,
  type ResolverId,
} from "@/tools/dns-lookup/lib/dns";

export async function lookupDns(input: { name: string; types?: RecordType[]; resolver?: ResolverId; mail?: boolean }) {
  const checked = validateName(input.name);
  if ("error" in checked) throw new PublicUrlError(checked.error);
  const resolver = input.resolver ?? "cloudflare";
  const types = input.types && input.types.length > 0 ? input.types : [...recordTypes];
  const unique = [...new Set(types)];
  const queries = await Promise.all(unique.map((type) => queryType(checked.name, type, resolver)));
  const records = queries.flatMap((query) => query.records);
  let dmarcRecords: DnsRecord[] = [];
  if (input.mail !== false) {
    const dmarc = await queryType(dmarcName(checked.name), "TXT", resolver);
    dmarcRecords = dmarc.records;
  }
  return {
    name: checked.name,
    resolver,
    records,
    queries: queries.map((query) => ({ type: query.type, rcode: query.rcode })),
    spf: parseSpf(records),
    dmarc: parseDmarc(dmarcRecords),
  };
}

async function queryType(name: string, type: RecordType, resolver: ResolverId): Promise<DnsQueryResult> {
  const endpoint = parsePublicHttpUrl(resolverEndpoints[resolver]);
  endpoint.searchParams.set("name", name);
  endpoint.searchParams.set("type", type);
  await assertPublicHost(endpoint);
  const response = await fetch(endpoint, {
    redirect: "manual",
    signal: AbortSignal.timeout(FETCH_LIMITS.timeoutMs),
    headers: {
      accept: "application/dns-json",
      "user-agent": "Benchline/1.0 (+https://tools.fabwaseem.com)",
    },
  });
  if (response.status >= 300 && response.status < 400) {
    await response.body?.cancel();
    throw new PublicUrlError("The resolver redirected. That is refused.");
  }
  if (response.status >= 400) {
    await response.body?.cancel();
    throw new PublicUrlError(`The resolver returned ${response.status}.`);
  }
  const text = await readCapped(response, FETCH_LIMITS.maxBytes);
  const parsed = parseDoh(text, type);
  if ("error" in parsed) throw new PublicUrlError(parsed.error);
  return parsed;
}

async function readCapped(response: Response, maxBytes: number) {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
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
  return new TextDecoder().decode(bytes);
}
