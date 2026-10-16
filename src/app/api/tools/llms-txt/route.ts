import { firstParagraph, looksLikeHtml, parseMetaTags, sameOriginLinks, textTitle } from "@/lib/html";
import { guard, readBody, toolError, toolJson } from "@/lib/api";
import { fetchPublic } from "@/lib/net/fetch-public";
import { parsePublicHttpUrl, PublicUrlError } from "@/lib/net/ssrf";
import { sitemapUrls } from "@/lib/robots";
import { isSitemapIndex, parseSitemapLocs, renderLlmsFull, renderLlmsTxt, type LlmsPage } from "@/tools/llms-txt-generator/lib/llms";

const PAGE_CAP = 30;

export async function POST(request: Request) {
  const blocked = await guard(request);
  if (blocked) return blocked;
  try {
    const body = (await readBody(request)) as { mode?: string; url?: string; urls?: string };
    const pages = body.mode === "urls" ? await fromList(body.urls ?? "") : await fromSite(body.url ?? "");
    if (pages.length === 0) throw new PublicUrlError("No public HTML pages were found.");
    const name = siteName(pages[0]!.url);
    const summary = pages[0]?.description || `Index of ${name}.`;
    return toolJson({
      pages: pages.length,
      llms: renderLlmsTxt(name, summary, pages),
      full: renderLlmsFull(name, summary, pages),
    });
  } catch (error) {
    return toolError(error);
  }
}

async function fromSite(input: string) {
  const root = parsePublicHttpUrl(input);
  const origin = root.origin;
  const warnings: string[] = [];
  let robots = "";
  try {
    const file = await fetchPublic(new URL("/robots.txt", origin).toString(), { accept: "text/plain" });
    if (file.status < 400 && !looksLikeHtml(file.text)) robots = file.text;
  } catch {
    warnings.push("robots.txt");
  }
  const seeds = [...sitemapUrls(robots).map((item) => new URL(item, origin).toString()), new URL("/sitemap.xml", origin).toString()];
  const pageUrls = new Set<string>();
  for (const seed of seeds) {
    if (pageUrls.size >= PAGE_CAP) break;
    try {
      const file = await fetchPublic(seed, { accept: "application/xml,text/xml" });
      if (file.status >= 400) continue;
      const locs = parseSitemapLocs(file.text);
      const lists = isSitemapIndex(file.text) ? locs.slice(0, 5) : [];
      const pages = isSitemapIndex(file.text) ? [] : locs;
      for (const page of pages) pageUrls.add(page);
      for (const list of lists) {
        const nested = await fetchPublic(list, { accept: "application/xml,text/xml" });
        for (const page of parseSitemapLocs(nested.text)) pageUrls.add(page);
      }
    } catch {
      continue;
    }
  }
  if (pageUrls.size === 0) {
    const home = await fetchPublic(origin);
    pageUrls.add(home.url);
    for (const link of sameOriginLinks(home.text, home.url)) pageUrls.add(link);
  }
  return collect([...pageUrls].slice(0, PAGE_CAP));
}

async function fromList(raw: string) {
  const urls = raw
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, PAGE_CAP);
  if (urls.length === 0) throw new PublicUrlError("Paste at least one URL.");
  return collect(urls);
}

async function collect(urls: string[]) {
  const pages: LlmsPage[] = [];
  const queue = [...urls];
  const workers = Array.from({ length: Math.min(4, queue.length) }, async () => {
    while (queue.length > 0) {
      const url = queue.shift();
      if (!url) return;
      try {
        const response = await fetchPublic(url);
        if (response.status >= 400 || !looksLikeHtml(response.text)) continue;
        const description = parseMetaTags(response.text).find((tag) => tag.key === "description")?.content ?? "";
        pages.push({
          url: response.url,
          title: textTitle(response.text) || response.url,
          description,
          excerpt: firstParagraph(response.text).slice(0, 280),
        });
      } catch {
        continue;
      }
    }
  });
  await Promise.all(workers);
  return pages;
}

function siteName(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Site";
  }
}
