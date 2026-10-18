import { fetchPublic } from "@/lib/net/fetch-public";
import { PublicUrlError } from "@/lib/net/ssrf";
import { pageToMarkdown } from "@/tools/html-to-markdown-url/lib/page";

export async function markdownFromUrl(input: string) {
  const response = await fetchPublic(input);
  if (response.status >= 400) throw new PublicUrlError(`The page returned ${response.status}.`);
  const looksHtml = response.contentType.includes("html") || response.text.toLowerCase().includes("<html");
  if (!looksHtml) throw new PublicUrlError("The response was not HTML.");
  return pageToMarkdown(response.text, response.url);
}
