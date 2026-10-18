import { CANONICAL_HOST, hostnameFromHost, LEGACY_HOST } from "@/lib/net/legacy-host";
import { SITE_URL } from "@/lib/site";

const PUBLIC_HOSTS = new Set([CANONICAL_HOST, LEGACY_HOST]);

export function originAllowed(hostHeader: string | null, originHeader: string | null): boolean {
  if (!originHeader) return true;
  let url: URL;
  try {
    url = new URL(originHeader);
  } catch {
    return false;
  }
  if (hostHeader && url.host === hostHeader) return true;
  const host = hostnameFromHost(hostHeader);
  if (host && PUBLIC_HOSTS.has(host) && url.hostname === host) return true;
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return true;
  if (url.protocol === "https:" && PUBLIC_HOSTS.has(url.hostname)) return true;
  return originHeader === SITE_URL;
}
