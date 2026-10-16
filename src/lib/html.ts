export function decodeEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, digits: string) => String.fromCodePoint(Number(digits)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

export function headHtml(html: string) {
  const match = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  return match?.[1] ?? html.slice(0, 100_000);
}

export type MetaTag = { key: string; content: string };

export function parseMetaTags(html: string): MetaTag[] {
  const source = headHtml(html);
  const tags: MetaTag[] = [];
  const pattern = /<meta\b[^>]*>/gi;
  for (const match of source.matchAll(pattern)) {
    const tag = match[0];
    const key =
      attr(tag, "property") ||
      attr(tag, "name") ||
      attr(tag, "itemprop") ||
      attr(tag, "http-equiv");
    const content = attr(tag, "content");
    if (key && content) tags.push({ key: key.toLowerCase(), content: decodeEntities(content) });
  }
  return tags;
}

export function attr(tag: string, name: string) {
  const pattern = new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const match = tag.match(pattern);
  return decodeEntities(match?.[2] ?? match?.[3] ?? match?.[4] ?? "");
}

export function textTitle(html: string) {
  const match = headHtml(html).match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return decodeEntities(match?.[1] ?? "");
}

export function htmlLang(html: string) {
  const match = html.match(/<html\b[^>]*>/i);
  return match ? attr(match[0], "lang") : "";
}

export function linkHref(html: string, rel: string) {
  const source = headHtml(html);
  const pattern = /<link\b[^>]*>/gi;
  for (const match of source.matchAll(pattern)) {
    const tagRel = attr(match[0], "rel").toLowerCase();
    if (tagRel.split(/\s+/).includes(rel.toLowerCase())) {
      const href = attr(match[0], "href");
      if (href) return href;
    }
  }
  return "";
}

export type JsonLdBlock = { types: string[]; raw: string };

export function jsonLdBlocks(html: string): JsonLdBlock[] {
  const blocks: JsonLdBlock[] = [];
  const pattern = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    const raw = (match[1] ?? "").trim();
    blocks.push({ types: jsonLdTypes(raw), raw });
  }
  return blocks;
}

function jsonLdTypes(raw: string) {
  const types = new Set<string>();
  try {
    collectTypes(JSON.parse(raw), types);
  } catch {
    for (const match of raw.matchAll(/"@type"\s*:\s*"([^"]+)"/g)) {
      if (match[1]) types.add(match[1]);
    }
  }
  return [...types];
}

function collectTypes(value: unknown, types: Set<string>) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) collectTypes(item, types);
    return;
  }
  const record = value as Record<string, unknown>;
  const type = record["@type"];
  if (typeof type === "string") types.add(type);
  if (Array.isArray(type)) {
    for (const item of type) if (typeof item === "string") types.add(item);
  }
  for (const nested of Object.values(record)) collectTypes(nested, types);
}

export function headings(html: string) {
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const found: { level: number; text: string }[] = [];
  for (const match of body.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const text = decodeEntities((match[2] ?? "").replace(/<[^>]+>/g, " "));
    if (text) found.push({ level: Number(match[1]), text });
  }
  return found;
}

export function firstParagraph(html: string) {
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const match = body.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
  return decodeEntities((match?.[1] ?? "").replace(/<[^>]+>/g, " "));
}

export function sameOriginLinks(html: string, base: string) {
  const links = new Set<string>();
  let origin: string;
  try {
    origin = new URL(base).origin;
  } catch {
    return [];
  }
  for (const match of html.matchAll(/<a\b[^>]*href\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
    const href = decodeEntities(match[2] ?? match[3] ?? "");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    try {
      const url = new URL(href, base);
      if (url.origin === origin && (url.protocol === "http:" || url.protocol === "https:")) {
        url.hash = "";
        links.add(url.toString());
      }
    } catch {
      continue;
    }
  }
  return [...links];
}

export function resolveUrl(value: string, base: string) {
  if (!value) return "";
  try {
    return new URL(value, base).toString();
  } catch {
    return value;
  }
}

export function looksLikeHtml(text: string) {
  const sample = text.trimStart().slice(0, 400).toLowerCase();
  return sample.startsWith("<!doctype html") || sample.startsWith("<html") || sample.includes("<head");
}
