export const LEGACY_HOST = "tools.fabwaseem.com";
export const CANONICAL_HOST = "benchline.fabwaseem.com";
export const CANONICAL_ORIGIN = "https://benchline.fabwaseem.com";

export function hostnameFromHost(host: string | null | undefined): string {
  const value = host?.trim().toLowerCase() ?? "";
  if (!value) return "";
  if (value.startsWith("[")) {
    const end = value.indexOf("]");
    return end === -1 ? value : value.slice(1, end);
  }
  const colon = value.lastIndexOf(":");
  if (colon !== -1 && /^\d+$/.test(value.slice(colon + 1))) return value.slice(0, colon);
  return value;
}

export function isMcpPath(pathname: string): boolean {
  return pathname === "/mcp" || pathname.startsWith("/mcp/");
}

export function legacyHostRedirect(host: string | null | undefined, pathname: string, search: string): URL | null {
  if (hostnameFromHost(host) !== LEGACY_HOST || isMcpPath(pathname)) return null;
  return new URL(pathname + search, CANONICAL_ORIGIN);
}
