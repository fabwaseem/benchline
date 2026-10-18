import { FETCH_LIMITS } from "@/lib/net/fetch-public";
import { outboundFetch } from "@/lib/net/outbound";
import { parsePublicHttpUrl, PublicUrlError } from "@/lib/net/ssrf";
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
  const response = await outboundFetch(endpoint.toString(), {
    method: "GET",
    ports: "web",
    followRedirects: false,
    redirectMessage: "The resolver redirected. That is refused.",
    timeoutMs: FETCH_LIMITS.timeoutMs,
    maxBytes: FETCH_LIMITS.maxBytes,
    tooLargeMessage: "Response is larger than 800 KB.",
    headers: {
      accept: "application/dns-json",
      "user-agent": "Benchline/1.0 (+https://tools.fabwaseem.com)",
    },
  });
  if (response.status >= 400) throw new PublicUrlError(`The resolver returned ${response.status}.`);
  const parsed = parseDoh(new TextDecoder().decode(response.body), type);
  if ("error" in parsed) throw new PublicUrlError(parsed.error);
  return parsed;
}
