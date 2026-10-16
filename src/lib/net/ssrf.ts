import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_HOSTS = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
]);

export class PublicUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicUrlError";
  }
}

export function isBlockedIp(ip: string): boolean {
  const normalized = ip.trim().toLowerCase();
  if (normalized === "::1" || normalized === "::" || normalized === "0.0.0.0") return true;

  const mapped = normalized.startsWith("::ffff:") ? normalized.slice(7) : normalized;
  if (mapped.includes(".")) {
    const parts = mapped.split(".").map((part) => Number(part));
    if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
      return true;
    }
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
    return false;
  }

  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) {
    return true;
  }
  return false;
}

export function parsePublicHttpUrl(input: string): URL {
  const trimmed = input.trim();
  if (!trimmed) throw new PublicUrlError("Enter a URL.");
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new PublicUrlError("Enter a valid URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new PublicUrlError("Only http and https URLs are allowed.");
  }
  if (url.username || url.password) {
    throw new PublicUrlError("URLs with credentials are not allowed.");
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new PublicUrlError("Only ports 80 and 443 are allowed.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host || BLOCKED_HOSTS.has(host) || host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".localhost")) {
    throw new PublicUrlError("That address is not public.");
  }
  if (isIP(host) && isBlockedIp(host)) {
    throw new PublicUrlError("That address is not public.");
  }
  return url;
}

export async function assertPublicHost(url: URL): Promise<void> {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) {
    if (isBlockedIp(host)) throw new PublicUrlError("That address is not public.");
    return;
  }
  let records: { address: string }[];
  try {
    records = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new PublicUrlError("Could not resolve that host.");
  }
  if (records.length === 0) throw new PublicUrlError("Could not resolve that host.");
  for (const record of records) {
    if (isBlockedIp(record.address)) {
      throw new PublicUrlError("That host resolves to a private address.");
    }
  }
}
