const BLOCKED_NAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "host.docker.internal",
  "gateway.docker.internal",
  "kubernetes",
  "kubernetes.default",
]);

const INTERNAL_SUFFIXES = [
  ".local",
  ".localhost",
  ".internal",
  ".localdomain",
  ".home.arpa",
  ".docker.internal",
  ".svc",
  ".cluster.local",
];

export type OutboundScheme = "http" | "https" | "ws" | "wss";

export type ParseOutboundOptions = {
  schemes?: OutboundScheme[];
  ports?: "web" | "any";
  allowMissingScheme?: boolean;
};

export class PublicUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicUrlError";
  }
}

export function normalizeHostname(input: string): string {
  let host = input.trim().toLowerCase();
  if (host.startsWith("[") && host.endsWith("]")) host = host.slice(1, -1);
  while (host.endsWith(".")) host = host.slice(0, -1);
  return host;
}

export function canonicalizeHost(input: string): string {
  const host = normalizeHostname(input);
  if (!host || /[\s/@\\]/.test(host)) return host;
  try {
    const wrapped = host.includes(":") ? `[${host}]` : host;
    return normalizeHostname(new URL(`http://${wrapped}`).hostname);
  } catch {
    return host;
  }
}

function parseDottedV4(host: string): number[] | null {
  const parts = host.split(".");
  if (parts.length !== 4) return null;
  const bytes: number[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const value = Number(part);
    if (!Number.isInteger(value) || value > 255) return null;
    bytes.push(value);
  }
  return bytes;
}

function parseIpv6(input: string): number[] | null {
  let text = input.toLowerCase();
  if (text.includes(".")) {
    const lastColon = text.lastIndexOf(":");
    if (lastColon < 0) return null;
    const v4 = parseDottedV4(text.slice(lastColon + 1));
    if (!v4) return null;
    const hi = ((v4[0]! << 8) | v4[1]!).toString(16);
    const lo = ((v4[2]! << 8) | v4[3]!).toString(16);
    text = `${text.slice(0, lastColon + 1)}${hi}:${lo}`;
  }
  const halves = text.split("::");
  if (halves.length > 2) return null;
  const parseSide = (side: string) => {
    if (!side) return [] as number[];
    const parts = side.split(":");
    if (parts.some((part) => !/^[0-9a-f]{1,4}$/.test(part))) return null;
    return parts.map((part) => Number.parseInt(part, 16));
  };
  const head = parseSide(halves[0] ?? "");
  if (!head) return null;
  if (halves.length === 1) return head.length === 8 ? head : null;
  const tail = parseSide(halves[1] ?? "");
  if (!tail || head.length + tail.length > 7) return null;
  return [...head, ...Array<number>(8 - head.length - tail.length).fill(0), ...tail];
}

function blockedV4(bytes: number[]): boolean {
  const a = bytes[0] ?? 0;
  const b = bytes[1] ?? 0;
  const c = bytes[2] ?? 0;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return true;
  if (a === 192 && b === 88 && c === 99) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a === 198 && b === 51 && c === 100) return true;
  if (a === 203 && b === 0 && c === 113) return true;
  if (a >= 224) return true;
  return false;
}

function embeddedV4(hi: number, lo: number): number[] {
  return [(hi >> 8) & 255, hi & 255, (lo >> 8) & 255, lo & 255];
}

function blockedV6(groups: number[]): boolean {
  if (groups.length !== 8) return true;
  if (groups.every((group) => group === 0)) return true;
  if (groups.slice(0, 7).every((group) => group === 0) && groups[7] === 1) return true;
  const g0 = groups[0] ?? 0;
  const g1 = groups[1] ?? 0;
  const g2 = groups[2] ?? 0;
  const g6 = groups[6] ?? 0;
  const g7 = groups[7] ?? 0;
  if (groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff) {
    return blockedV4(embeddedV4(g6, g7));
  }
  if (groups.slice(0, 6).every((group) => group === 0)) {
    return blockedV4(embeddedV4(g6, g7));
  }
  if ((g0 & 0xfe00) === 0xfc00) return true;
  if ((g0 & 0xffc0) === 0xfe80) return true;
  if ((g0 & 0xffc0) === 0xfec0) return true;
  if ((g0 & 0xff00) === 0xff00) return true;
  if (g0 === 0x2001 && g1 === 0x0db8) return true;
  if (g0 === 0x0100 && groups.slice(1, 4).every((group) => group === 0)) return true;
  if (g0 === 0x2002 && blockedV4(embeddedV4(g1, g2))) return true;
  if (g0 === 0x0064 && g1 === 0xff9b && groups.slice(2, 6).every((group) => group === 0)) {
    return blockedV4(embeddedV4(g6, g7));
  }
  return false;
}

export function isIpLiteral(host: string): boolean {
  const canonical = canonicalizeHost(host);
  return parseDottedV4(canonical) !== null || parseIpv6(canonical) !== null;
}

export function isBlockedIp(ip: string): boolean {
  const canonical = canonicalizeHost(ip);
  const v4 = parseDottedV4(canonical);
  if (v4) return blockedV4(v4);
  const v6 = parseIpv6(canonical);
  if (v6) return blockedV6(v6);
  return true;
}

export function assertPublicHostname(host: string): void {
  const name = canonicalizeHost(host);
  if (!name) throw new PublicUrlError("That address is not public.");
  if (isIpLiteral(name)) {
    if (isBlockedIp(name)) throw new PublicUrlError("That address is not public.");
    return;
  }
  if (!name.includes(".") || BLOCKED_NAMES.has(name) || INTERNAL_SUFFIXES.some((suffix) => name.endsWith(suffix))) {
    throw new PublicUrlError("That address is not public.");
  }
}

function schemeMessage(schemes: OutboundScheme[]): string {
  if (schemes.length === 2 && schemes[0] === "http" && schemes[1] === "https") {
    return "Only http and https URLs are allowed.";
  }
  if (schemes.length === 2 && schemes[0] === "ws" && schemes[1] === "wss") {
    return "Only ws and wss URLs are allowed.";
  }
  return `Only ${schemes.join(" and ")} URLs are allowed.`;
}

export function parseOutboundUrl(input: string, options: ParseOutboundOptions = {}): URL {
  const schemes = options.schemes ?? ["http", "https"];
  const ports = options.ports ?? "web";
  const trimmed = input.trim();
  if (!trimmed) throw new PublicUrlError("Enter a URL.");
  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed);
  const withProtocol = !hasScheme && options.allowMissingScheme ? `https://${trimmed}` : trimmed;
  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new PublicUrlError("Enter a valid URL.");
  }
  const scheme = url.protocol.replace(/:$/, "");
  if (!schemes.includes(scheme as OutboundScheme)) throw new PublicUrlError(schemeMessage(schemes));
  if (url.username || url.password) throw new PublicUrlError("URLs with credentials are not allowed.");
  assertPublicHostname(url.hostname);
  if (url.port) {
    const port = Number(url.port);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new PublicUrlError("That port is not allowed.");
    if (ports === "web" && port !== 80 && port !== 443) throw new PublicUrlError("Only ports 80 and 443 are allowed.");
  }
  return url;
}

export function parsePublicHttpUrl(input: string): URL {
  return parseOutboundUrl(input, { allowMissingScheme: true, ports: "web", schemes: ["http", "https"] });
}
