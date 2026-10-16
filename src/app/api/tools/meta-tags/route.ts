import { guard, readBody, toolError, toolJson } from "@/lib/api";
import { fetchPublic } from "@/lib/net/fetch-public";
import { inspectHtml } from "@/tools/meta-tags-inspector/lib/meta";

export async function POST(request: Request) {
  const blocked = await guard(request);
  if (blocked) return blocked;
  try {
    const body = (await readBody(request)) as { url?: string };
    const response = await fetchPublic(body.url ?? "");
    if (response.status >= 400) {
      return Response.json({ error: `The page returned ${response.status}.` }, { status: 502, headers: { "cache-control": "no-store" } });
    }
    if (!response.contentType.includes("html") && !response.text.toLowerCase().includes("<html")) {
      return Response.json({ error: "The response was not HTML." }, { status: 415, headers: { "cache-control": "no-store" } });
    }
    return toolJson({
      status: response.status,
      redirects: response.redirects,
      ...inspectHtml(response.text, response.url),
    });
  } catch (error) {
    return toolError(error);
  }
}
