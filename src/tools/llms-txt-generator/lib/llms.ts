export type LlmsPage = {
  url: string;
  title: string;
  description: string;
  excerpt: string;
};

const OPTIONAL = /(privacy|terms|legal|account|login|signin|sign-in|cart|checkout)/i;

export function sectionFor(url: string) {
  let path = "/";
  try {
    path = new URL(url).pathname.toLowerCase();
  } catch {
    path = url.toLowerCase();
  }
  if (OPTIONAL.test(path)) return "Optional";
  if (path.includes("/docs") || path.includes("/documentation") || path.includes("/guide")) return "Docs";
  if (path.includes("/blog") || path.includes("/posts") || path.includes("/articles")) return "Blog";
  if (path.includes("/api") || path.includes("/reference")) return "API";
  if (path.includes("/product") || path.includes("/pricing") || path.includes("/features")) return "Product";
  if (path.includes("/about") || path.includes("/contact")) return "About";
  return "Pages";
}

export function groupPages(pages: LlmsPage[]) {
  const groups = new Map<string, LlmsPage[]>();
  for (const page of pages) {
    const section = sectionFor(page.url);
    const list = groups.get(section) ?? [];
    list.push(page);
    groups.set(section, list);
  }
  const order = ["Docs", "Blog", "API", "Product", "About", "Pages", "Optional"];
  return order.flatMap((name) => {
    const items = groups.get(name);
    return items && items.length > 0 ? [{ name, items }] : [];
  });
}

function linkLine(page: LlmsPage) {
  const title = page.title || page.url;
  const note = page.description ? `: ${page.description.replace(/\s+/g, " ").trim()}` : "";
  return `- [${title.replace(/[\[\]]/g, "")}](${page.url})${note}`;
}

export function renderLlmsTxt(siteName: string, summary: string, pages: LlmsPage[]) {
  const groups = groupPages(pages);
  const lines = [`# ${siteName}`, "", `> ${summary}`, ""];
  for (const group of groups) {
    lines.push(`## ${group.name}`, "");
    for (const page of group.items) lines.push(linkLine(page));
    lines.push("");
  }
  return `${lines.join("\n").trim()}\n`;
}

export function renderLlmsFull(siteName: string, summary: string, pages: LlmsPage[]) {
  const lines = [`# ${siteName}`, "", `> ${summary}`, ""];
  for (const page of pages) {
    lines.push(`## ${page.title || page.url}`, "", page.url, "");
    if (page.excerpt) lines.push(page.excerpt, "");
  }
  return `${lines.join("\n").trim()}\n`;
}

export function parseSitemapLocs(xml: string) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
    .map((match) => (match[1] ?? "").replace(/&amp;/g, "&").trim())
    .filter(Boolean);
}

export function isSitemapIndex(xml: string) {
  return /<sitemapindex\b/i.test(xml);
}
