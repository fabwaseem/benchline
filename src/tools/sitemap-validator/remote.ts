import { fetchExchange } from "@/lib/net/exchange";
import { fetchPublic } from "@/lib/net/fetch-public";
import { PublicUrlError } from "@/lib/net/ssrf";
import { analyzeSitemap, locationProblem, type SitemapIssue, type SitemapReport, type SitemapUrl } from "@/tools/sitemap-validator/lib/sitemap";

const CHILD_CAP = 3;
const PROBE_CAP = 5;

export async function inspectSitemap(input: { url?: string; xml?: string; probe?: boolean }) {
  const url = input.url?.trim() ?? "";
  const xml = input.xml?.trim() ?? "";
  if (url && xml) throw new PublicUrlError("Provide a URL or XML, not both.");
  if (!url && !xml) throw new PublicUrlError("Provide a URL or XML.");
  if (xml) {
    const report = analyzeSitemap(xml);
    if ("error" in report) throw new PublicUrlError(report.error);
    return { ...report, source: "", probes: [] as { url: string; status: number; error: string }[] };
  }
  const response = await fetchPublic(url, { accept: "application/xml,text/xml,text/plain,*/*" });
  if (response.status >= 400) throw new PublicUrlError(`The sitemap returned ${response.status}.`);
  const report = analyzeSitemap(response.text);
  if ("error" in report) throw new PublicUrlError(report.error);
  const issues: SitemapIssue[] = [...report.issues];
  let urls = report.urls;
  let urlCount = report.urlCount;
  if (report.kind === "index") {
    const extra = await loadChildren(report.sitemaps.slice(0, CHILD_CAP));
    issues.push(...extra.issues);
    urls = extra.urls;
    urlCount = extra.urlCount;
  }
  const probes = input.probe === false ? [] : await probeUrls(urls.slice(0, PROBE_CAP));
  return {
    kind: report.kind,
    urlCount,
    sitemapCount: report.sitemapCount,
    urls,
    sitemaps: report.sitemaps,
    issues,
    source: response.url,
    probes,
  };
}

async function loadChildren(locs: string[]) {
  const issues: SitemapIssue[] = [];
  const urls: SitemapUrl[] = [];
  let urlCount = 0;
  for (const loc of locs) {
    try {
      const response = await fetchPublic(loc, { accept: "application/xml,text/xml,*/*" });
      const report = analyzeSitemap(response.text);
      if ("error" in report) {
        issues.push({ level: "fail", label: "Child sitemap", detail: `${loc}: ${report.error}` });
        continue;
      }
      urlCount += report.urlCount;
      for (const url of report.urls) {
        if (urls.length < 50) urls.push(url);
      }
      issues.push({ level: report.urlCount > 0 ? "pass" : "warn", label: "Child sitemap", detail: `${loc}: ${report.urlCount} URLs.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "The child sitemap failed.";
      issues.push({ level: "fail", label: "Child sitemap", detail: `${loc}: ${message}` });
    }
  }
  return { issues, urls, urlCount };
}

async function probeUrls(urls: SitemapUrl[]) {
  const probes: { url: string; status: number; error: string }[] = [];
  for (const url of urls) {
    const problem = locationProblem(url.loc);
    if (problem) {
      probes.push({ url: url.loc, status: 0, error: problem });
      continue;
    }
    try {
      const hit = await fetchExchange(url.loc, { readBody: false });
      probes.push({ url: hit.url, status: hit.status, error: "" });
    } catch (error) {
      probes.push({ url: url.loc, status: 0, error: error instanceof Error ? error.message : "The request failed." });
    }
  }
  return probes;
}

export type { SitemapReport };
