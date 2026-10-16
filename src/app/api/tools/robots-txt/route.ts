import { looksLikeHtml } from "@/lib/html";
import { guard, readBody, toolError, toolJson } from "@/lib/api";
import { fetchPublic } from "@/lib/net/fetch-public";
import { parsePublicHttpUrl } from "@/lib/net/ssrf";
import { parseRobots, robotsIssues } from "@/lib/robots";

export async function POST(request: Request) {
  const blocked = await guard(request);
  if (blocked) return blocked;
  try {
    const body = (await readBody(request)) as { url?: string };
    const parsed = parsePublicHttpUrl(body.url ?? "");
    const target = parsed.pathname.endsWith("robots.txt") ? parsed : new URL("/robots.txt", parsed.origin);
    const response = await fetchPublic(target.toString(), { accept: "text/plain,text/html;q=0.5" });
    const html = looksLikeHtml(response.text);
    const document = response.status === 404 || html ? { groups: [], sitemaps: [] } : parseRobots(response.text);
    return toolJson({
      finalUrl: response.url,
      status: response.status,
      text: response.status === 404 ? "" : response.text.slice(0, 100_000),
      document,
      issues: robotsIssues(document, { html, status: response.status }),
    });
  } catch (error) {
    return toolError(error);
  }
}
