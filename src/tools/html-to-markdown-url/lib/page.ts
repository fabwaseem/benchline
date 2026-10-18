import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import { countTokens } from "@/tools/ai-token-counter/lib/tokenize";
import { cleanHtml, htmlToMarkdown } from "@/tools/markdown-html/lib/convert";

const chrome = "script, style, noscript, nav, footer, iframe, aside, header, form";

function articleDocument(html: string) {
  const { document } = parseHTML(html);
  for (const node of document.querySelectorAll(chrome)) node.remove();
  return document;
}

export function pageToMarkdown(html: string, pageUrl: string) {
  const document = articleDocument(html);
  const article = new Readability(document).parse();
  const title = article?.title?.trim() || document.title?.trim() || "";
  const content = article?.content || document.body?.innerHTML || "";
  const excerpt = article?.excerpt?.trim() || "";
  let markdown = htmlToMarkdown(cleanHtml(content), false).trim();
  if (title && !markdown.startsWith("#")) markdown = `# ${title}\n\n${markdown}`.trim();
  return {
    url: pageUrl,
    title,
    markdown,
    excerpt,
    tokens: countTokens(markdown, "o200k").count,
    chars: markdown.length,
  };
}
