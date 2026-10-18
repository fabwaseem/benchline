import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

export const convertTargets = ["html", "markdown"] as const;
export type ConvertTarget = (typeof convertTargets)[number];

const allowedTags = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "ul", "ol", "li", "pre", "code", "blockquote",
  "table", "thead", "tbody", "tr", "th", "td",
  "a", "img", "strong", "em", "hr", "del", "sup", "sub",
];

export function cleanHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes: {
      a: ["href", "title"],
      img: ["src", "alt", "title"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
      code: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
  });
}

export function markdownToHtml(markdown: string, sanitize: boolean) {
  const html = marked.parse(markdown, { async: false, gfm: true });
  return sanitize ? cleanHtml(html) : html;
}

export function htmlToMarkdown(html: string, sanitize: boolean) {
  const source = sanitize ? cleanHtml(html) : html;
  const service = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  service.use(gfm);
  return service.turndown(source);
}

export const sampleMarkdown = `# Heading

A paragraph with **bold** and a [link](https://example.com).

- one
- two
`;
