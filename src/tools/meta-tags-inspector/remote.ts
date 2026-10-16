import { fetchPublic } from "@/lib/net/fetch-public";
import { PublicUrlError } from "@/lib/net/ssrf";
import { inspectHtml } from "@/tools/meta-tags-inspector/lib/meta";

export async function inspectPublicUrl(input: string) {
  const response = await fetchPublic(input);
  if (response.status >= 400) {
    throw new PublicUrlError(`The page returned ${response.status}.`);
  }
  if (!response.contentType.includes("html") && !response.text.toLowerCase().includes("<html")) {
    throw new PublicUrlError("The response was not HTML.");
  }
  return {
    status: response.status,
    redirects: response.redirects,
    ...inspectHtml(response.text, response.url),
  };
}
