import { XMLParser } from "fast-xml-parser";

export type CheckLevel = "pass" | "warn" | "fail" | "info";

export type SitemapIssue = { level: CheckLevel; label: string; detail: string };

export type SitemapUrl = {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
};

export type SitemapReport = {
  kind: "urlset" | "index" | "unknown";
  urlCount: number;
  sitemapCount: number;
  urls: SitemapUrl[];
  sitemaps: string[];
  issues: SitemapIssue[];
};

const CHANGEFREQ = new Set(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]);
const LIST_CAP = 50;

const parser = new XMLParser({
  ignoreAttributes: true,
  removeNSPrefix: true,
  trimValues: true,
  isArray: (name) => name === "url" || name === "sitemap",
});

export function analyzeSitemap(xml: string, now = new Date()): SitemapReport | { error: string } {
  const text = xml.replace(/^\uFEFF/, "").trim();
  if (!text) return { error: "Paste sitemap XML or fetch a URL." };
  if (text.length > 1_000_000) return { error: "Sitemap XML is larger than 1 MB." };
  let parsed: unknown;
  try {
    parsed = parser.parse(text);
  } catch {
    return { error: "That XML could not be parsed." };
  }
  if (!parsed || typeof parsed !== "object") return { error: "That XML could not be parsed." };
  const root = parsed as Record<string, unknown>;
  if (root.urlset) return reportUrlset(root.urlset, now);
  if (root.sitemapindex) return reportIndex(root.sitemapindex);
  return {
    kind: "unknown",
    urlCount: 0,
    sitemapCount: 0,
    urls: [],
    sitemaps: [],
    issues: [{ level: "fail", label: "Root element", detail: "Expected urlset or sitemapindex." }],
  };
}

export function generateSitemap(lines: string[], now = new Date()) {
  const urls = lines.map((line) => line.trim()).filter(Boolean);
  if (urls.length === 0) return { error: "Enter at least one URL." };
  if (urls.length > 50_000) return { error: "A sitemap holds at most 50,000 URLs." };
  const lastmod = now.toISOString().slice(0, 10);
  const body = urls
    .map((loc) => `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  const report = analyzeSitemap(xml, now);
  if ("error" in report) return report;
  return { xml, report };
}

function reportUrlset(node: unknown, now: Date): SitemapReport {
  const urls = asRecords(record(node).url).map((item) => ({
    loc: text(item.loc),
    lastmod: text(item.lastmod),
    changefreq: text(item.changefreq),
    priority: text(item.priority),
  }));
  const issues: SitemapIssue[] = [];
  if (urls.length === 0) issues.push({ level: "fail", label: "URLs", detail: "The urlset has no url entries." });
  else issues.push({ level: "pass", label: "URLs", detail: `${urls.length.toLocaleString("en-US")} URL${urls.length === 1 ? "" : "s"}.` });
  if (urls.length > 50_000) issues.push({ level: "fail", label: "Size", detail: "A single sitemap can list at most 50,000 URLs." });
  const seen = new Set<string>();
  for (const url of urls) {
    issues.push(...issuesForUrl(url, now));
    if (url.loc && seen.has(url.loc)) issues.push({ level: "warn", label: "Duplicate", detail: url.loc });
    if (url.loc) seen.add(url.loc);
  }
  return { kind: "urlset", urlCount: urls.length, sitemapCount: 0, urls: urls.slice(0, LIST_CAP), sitemaps: [], issues };
}

function reportIndex(node: unknown): SitemapReport {
  const sitemaps = asRecords(record(node).sitemap).map((item) => text(item.loc)).filter(Boolean);
  const issues: SitemapIssue[] = [];
  if (sitemaps.length === 0) issues.push({ level: "fail", label: "Sitemaps", detail: "The index has no sitemap entries." });
  else issues.push({ level: "pass", label: "Index", detail: `${sitemaps.length.toLocaleString("en-US")} child sitemap${sitemaps.length === 1 ? "" : "s"}.` });
  for (const loc of sitemaps) {
    const problem = locationProblem(loc);
    if (problem) issues.push({ level: "fail", label: "Child loc", detail: `${loc || "(empty)"}: ${problem}` });
  }
  return { kind: "index", urlCount: 0, sitemapCount: sitemaps.length, urls: [], sitemaps: sitemaps.slice(0, LIST_CAP), issues };
}

function issuesForUrl(url: SitemapUrl, now: Date): SitemapIssue[] {
  const issues: SitemapIssue[] = [];
  const problem = locationProblem(url.loc);
  if (problem) issues.push({ level: "fail", label: "loc", detail: `${url.loc || "(empty)"}: ${problem}` });
  if (url.lastmod) {
    const time = Date.parse(url.lastmod);
    if (Number.isNaN(time)) issues.push({ level: "fail", label: "lastmod", detail: `${url.loc}: ${url.lastmod} is not a date.` });
    else if (time > now.getTime() + 86_400_000) issues.push({ level: "warn", label: "lastmod", detail: `${url.loc}: ${url.lastmod} is in the future.` });
  }
  if (url.changefreq && !CHANGEFREQ.has(url.changefreq)) {
    issues.push({ level: "warn", label: "changefreq", detail: `${url.loc}: ${url.changefreq} is not a sitemap frequency.` });
  }
  if (url.priority) {
    const value = Number(url.priority);
    if (!Number.isFinite(value) || value < 0 || value > 1) issues.push({ level: "warn", label: "priority", detail: `${url.loc}: priority must be from 0.0 to 1.0.` });
  }
  return issues;
}

export function locationProblem(loc: string) {
  if (!loc) return "Missing loc.";
  let url: URL;
  try {
    url = new URL(loc);
  } catch {
    return "Location must be an absolute URL.";
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return "Location must be http or https.";
  if (url.username || url.password) return "Location must not include credentials.";
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (isPrivateHost(host)) return "Location points at a private address.";
  return "";
}

function isPrivateHost(host: string) {
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return true;
  const parts = host.split(".").map((part) => Number(part));
  if (parts.length === 4 && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) {
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b !== undefined && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b !== undefined && b >= 64 && b <= 127) return true;
  }
  return host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80");
}

function record(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asRecords(value: unknown) {
  if (Array.isArray(value)) return value.filter((item) => item && typeof item === "object") as Record<string, unknown>[];
  if (value && typeof value === "object") return [value as Record<string, unknown>];
  return [];
}

function text(value: unknown) {
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  return "";
}

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
