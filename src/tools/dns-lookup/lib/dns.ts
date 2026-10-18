export const recordTypes = ["A", "AAAA", "MX", "TXT", "CNAME", "CAA"] as const;
export type RecordType = (typeof recordTypes)[number];

export const resolvers = ["cloudflare", "google"] as const;
export type ResolverId = (typeof resolvers)[number];

export const resolverEndpoints: Record<ResolverId, string> = {
  cloudflare: "https://cloudflare-dns.com/dns-query",
  google: "https://dns.google/resolve",
};

const TYPE_CODE: Record<RecordType, number> = {
  A: 1,
  AAAA: 28,
  CNAME: 5,
  MX: 15,
  TXT: 16,
  CAA: 257,
};

const CODE_TYPE = new Map<number, RecordType>(recordTypes.map((type) => [TYPE_CODE[type], type]));

const RCODES = ["NOERROR", "FORMERR", "SERVFAIL", "NXDOMAIN", "NOTIMP", "REFUSED"] as const;

const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export type DnsRecord = {
  type: string;
  name: string;
  ttl: number;
  data: string;
};

export type SpfMechanism = {
  qualifier: string;
  mechanism: string;
  value: string;
};

export type SpfSummary = {
  raw: string;
  all: string;
  mechanisms: SpfMechanism[];
};

export type DmarcSummary = {
  raw: string;
  policy: string;
  subdomainPolicy: string;
  rua: string;
  pct: string;
};

export type DnsQueryResult = {
  type: RecordType;
  rcode: string;
  records: DnsRecord[];
};

export function validateName(input: string): { name: string } | { error: string } {
  const name = input.trim().toLowerCase().replace(/\.$/, "");
  if (!name) return { error: "Enter a hostname." };
  if (name.length > 253) return { error: "That hostname is too long." };
  if (/[:/\s@]/.test(name) || name.includes("..")) return { error: "Enter a hostname, not a URL." };
  if (
    name === "localhost" ||
    name.endsWith(".localhost") ||
    name.endsWith(".local") ||
    name.endsWith(".internal") ||
    name === "metadata.google.internal"
  ) {
    return { error: "That name is not a public hostname." };
  }
  const labels = name.split(".");
  if (labels.length < 2) return { error: "Enter a full hostname, such as example.com." };
  if (labels.some((label) => !LABEL.test(label))) return { error: "That hostname has an invalid label." };
  return { name };
}

export function dmarcName(name: string) {
  return name.startsWith("_dmarc.") ? name : `_dmarc.${name}`;
}

export function decodeTxt(data: string) {
  const parts = [...data.matchAll(/"((?:\\.|[^"\\])*)"/g)].map((match) => match[1]?.replace(/\\(.)/g, "$1") ?? "");
  return parts.length > 0 ? parts.join("") : data;
}

export function rcodeName(status: number) {
  return RCODES[status] ?? `RCODE ${status}`;
}

export function parseDoh(body: string, fallbackType: RecordType): DnsQueryResult | { error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return { error: "The resolver did not return DNS JSON." };
  }
  if (!parsed || typeof parsed !== "object") return { error: "The resolver did not return DNS JSON." };
  const status = "Status" in parsed && typeof parsed.Status === "number" ? parsed.Status : 0;
  const answers = "Answer" in parsed && Array.isArray(parsed.Answer) ? parsed.Answer : [];
  const records: DnsRecord[] = [];
  for (const answer of answers) {
    if (!answer || typeof answer !== "object") continue;
    const row = answer as { name?: unknown; type?: unknown; TTL?: unknown; data?: unknown };
    const code = typeof row.type === "number" ? row.type : TYPE_CODE[fallbackType];
    const type = CODE_TYPE.get(code) ?? fallbackType;
    const data = typeof row.data === "string" ? row.data : "";
    records.push({
      type,
      name: typeof row.name === "string" ? row.name.replace(/\.$/, "") : "",
      ttl: typeof row.TTL === "number" ? row.TTL : 0,
      data: type === "TXT" ? decodeTxt(data) : data.replace(/\.$/, ""),
    });
  }
  return { type: fallbackType, rcode: rcodeName(status), records };
}

export function parseSpf(records: DnsRecord[]): SpfSummary | null {
  const raw = records.find((record) => record.type === "TXT" && record.data.toLowerCase().startsWith("v=spf1"))?.data;
  if (!raw) return null;
  const tokens = raw.split(/\s+/).slice(1);
  const mechanisms: SpfMechanism[] = [];
  let all = "";
  for (const token of tokens) {
    const qualifier = "+-~?".includes(token[0] ?? "") ? token[0] ?? "" : "+";
    const body = qualifier === token[0] ? token.slice(1) : token;
    const [mechanism, value = ""] = body.split(":", 2);
    if (!mechanism) continue;
    if (mechanism.toLowerCase() === "all") all = qualifier;
    mechanisms.push({ qualifier, mechanism: mechanism.toLowerCase(), value });
  }
  return { raw, all: all || "?", mechanisms };
}

export function parseDmarc(records: DnsRecord[]): DmarcSummary | null {
  const raw = records.find((record) => record.type === "TXT" && record.data.toLowerCase().startsWith("v=dmarc1"))?.data;
  if (!raw) return null;
  const tags = new Map<string, string>();
  for (const part of raw.split(";")) {
    const [key, value = ""] = part.split("=", 2);
    if (!key?.trim()) continue;
    tags.set(key.trim().toLowerCase(), value.trim());
  }
  return {
    raw,
    policy: tags.get("p") ?? "",
    subdomainPolicy: tags.get("sp") ?? "",
    rua: tags.get("rua") ?? "",
    pct: tags.get("pct") ?? "",
  };
}
