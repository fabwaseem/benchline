export const encodeModes = ["component", "full"] as const;
export type EncodeMode = (typeof encodeModes)[number];

export const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
export type UtmKey = (typeof utmKeys)[number];

export type QueryParam = { key: string; value: string };

export type UrlParts = {
  href: string;
  protocol: string;
  username: string;
  hostname: string;
  port: string;
  pathname: string;
  hash: string;
  params: QueryParam[];
};

export type UrlError = { error: string };

export function encodeUrl(value: string, mode: EncodeMode) {
  return mode === "component" ? encodeURIComponent(value) : encodeURI(value);
}

export function decodeUrl(value: string, plusAsSpace = false): { value: string } | UrlError {
  try {
    const prepared = plusAsSpace ? value.replace(/\+/g, " ") : value;
    return { value: decodeURIComponent(prepared) };
  } catch {
    return { error: "That value has a % that is not followed by two hex digits." };
  }
}

export function parseQuery(input: string): QueryParam[] | UrlError {
  const raw = input.trim().replace(/^\?/, "");
  if (!raw) return [];
  const params: QueryParam[] = [];
  for (const part of raw.split("&")) {
    if (!part) continue;
    const eq = part.indexOf("=");
    const keyText = eq === -1 ? part : part.slice(0, eq);
    const valueText = eq === -1 ? "" : part.slice(eq + 1);
    const key = decodeUrl(keyText, true);
    const value = decodeUrl(valueText, true);
    if ("error" in key) return key;
    if ("error" in value) return value;
    params.push({ key: key.value, value: value.value });
  }
  return params;
}

export function serializeQuery(params: QueryParam[]) {
  return params
    .filter((param) => param.key !== "" || param.value !== "")
    .map((param) => `${encodeURIComponent(param.key)}=${encodeURIComponent(param.value)}`)
    .join("&");
}

export function parseUrl(input: string): UrlParts | UrlError {
  const trimmed = input.trim();
  if (!trimmed) return { error: "Enter a URL or a query string." };
  if (isQuery(trimmed)) {
    const params = parseQuery(trimmed);
    if ("error" in params) return params;
    return { href: "", protocol: "", username: "", hostname: "", port: "", pathname: "", hash: "", params };
  }
  const direct = toUrl(trimmed) ?? (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? null : toUrl(`https://${trimmed}`));
  if (!direct) return { error: "That is not a URL this parser can read." };
  const params = parseQuery(direct.search);
  if ("error" in params) return params;
  return {
    href: direct.href,
    protocol: direct.protocol,
    username: direct.username,
    hostname: direct.hostname,
    port: direct.port,
    pathname: direct.pathname,
    hash: direct.hash,
    params,
  };
}

export function replaceQuery(input: string, params: QueryParam[]): string | UrlError {
  const query = serializeQuery(params);
  const trimmed = input.trim();
  if (!trimmed || isQuery(trimmed)) return query ? `?${query}` : "";
  const direct = toUrl(trimmed) ?? toUrl(`https://${trimmed}`);
  if (!direct) return { error: "That is not a URL this parser can read." };
  direct.search = query ? `?${query}` : "";
  return /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? direct.href : direct.href.replace(/^https:\/\//, "");
}

export function withUtm(params: QueryParam[], utm: Partial<Record<UtmKey, string>>) {
  const next = params.filter((param) => !utmKeys.includes(param.key as UtmKey));
  for (const key of utmKeys) {
    const value = utm[key]?.trim() ?? "";
    if (value) next.push({ key, value });
  }
  return next;
}

function isQuery(value: string) {
  return value.startsWith("?") || (!value.includes("://") && !value.includes("/") && value.includes("="));
}

function toUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}
