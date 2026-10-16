import { looksLikeHtml } from "@/lib/html";
import { fetchPublic } from "@/lib/net/fetch-public";
import { parsePublicHttpUrl } from "@/lib/net/ssrf";
import { parseRobots, robotsIssues } from "@/lib/robots";

export async function checkRobotsUrl(input: string) {
  const parsed = parsePublicHttpUrl(input);
  const target = parsed.pathname.endsWith("robots.txt") ? parsed : new URL("/robots.txt", parsed.origin);
  const response = await fetchPublic(target.toString(), { accept: "text/plain,text/html;q=0.5" });
  const html = looksLikeHtml(response.text);
  const document = response.status === 404 || html ? { groups: [], sitemaps: [] } : parseRobots(response.text);
  return {
    finalUrl: response.url,
    status: response.status,
    contentType: (response.contentType.split(";")[0] ?? "").trim(),
    bytes: response.bytes,
    text: response.status === 404 ? "" : response.text.slice(0, 100_000),
    document,
    issues: robotsIssues(document, { html, status: response.status }),
  };
}
