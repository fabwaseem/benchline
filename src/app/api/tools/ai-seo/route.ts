import { firstParagraph, headings, jsonLdBlocks, linkHref, parseMetaTags, resolveUrl, textTitle } from "@/lib/html";
import { guard, readBody, toolError, toolJson } from "@/lib/api";
import { fetchPublic } from "@/lib/net/fetch-public";
import { parsePublicHttpUrl } from "@/lib/net/ssrf";
import { parseRobots, sitemapUrls } from "@/lib/robots";
import { scoreSeo } from "@/tools/ai-seo-checker/lib/score";

export async function POST(request: Request) {
  const blocked = await guard(request);
  if (blocked) return blocked;
  try {
    const body = (await readBody(request)) as { url?: string };
    const pageUrl = parsePublicHttpUrl(body.url ?? "");
    const page = await fetchPublic(pageUrl.toString());
    const origin = new URL(page.url).origin;
    const tags = parseMetaTags(page.text);
    const content = (key: string) => tags.find((tag) => tag.key === key)?.content ?? "";
    const robotsFile = await optional(new URL("/robots.txt", origin).toString());
    const llms = await optional(new URL("/llms.txt", origin).toString());
    const robots = robotsFile && robotsFile.status < 400 ? parseRobots(robotsFile.text) : null;
    const sitemapCandidates = [
      ...(robots ? sitemapUrls(robotsFile?.text ?? "").map((item) => new URL(item, origin).toString()) : []),
      new URL("/sitemap.xml", origin).toString(),
    ];
    let sitemapFound = false;
    for (const candidate of sitemapCandidates) {
      const file = await optional(candidate);
      if (file && file.status < 400 && file.text.includes("<loc")) {
        sitemapFound = true;
        break;
      }
    }
    const report = scoreSeo({
      finalUrl: page.url,
      status: page.status,
      elapsedMs: page.elapsedMs,
      title: textTitle(page.text),
      description: content("description"),
      canonical: resolveUrl(linkHref(page.text, "canonical"), page.url),
      robotsMeta: content("robots"),
      ogTitle: content("og:title"),
      ogDescription: content("og:description"),
      ogImage: resolveUrl(content("og:image"), page.url),
      headings: headings(page.text),
      lead: firstParagraph(page.text),
      jsonLdTypes: [...new Set(jsonLdBlocks(page.text).flatMap((block) => block.types))],
      llmsStatus: llms?.status ?? 0,
      sitemapFound,
      robots,
    });
    return toolJson({ finalUrl: page.url, status: page.status, ...report });
  } catch (error) {
    return toolError(error);
  }
}

async function optional(url: string) {
  try {
    return await fetchPublic(url);
  } catch {
    return null;
  }
}
