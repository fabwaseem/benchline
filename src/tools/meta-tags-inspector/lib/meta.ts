import { headings, htmlLang, jsonLdBlocks, linkHref, parseMetaTags, resolveUrl, textTitle } from "@/lib/html";

export type MetaCheck = { level: "pass" | "warn" | "fail"; label: string; detail: string };

export type Inspection = {
  finalUrl: string;
  title: string;
  description: string;
  canonical: string;
  robots: string;
  viewport: string;
  lang: string;
  themeColor: string;
  og: Record<string, string>;
  twitter: Record<string, string>;
  icons: string[];
  jsonLdTypes: string[];
  checks: MetaCheck[];
};

export function inspectHtml(html: string, finalUrl: string): Inspection {
  const tags = parseMetaTags(html);
  const content = (key: string) => tags.find((tag) => tag.key === key)?.content ?? "";
  const og: Record<string, string> = {};
  const twitter: Record<string, string> = {};
  const urlKeys = new Set(["og:image", "og:url", "og:audio", "og:video", "og:logo", "twitter:image"]);
  for (const tag of tags) {
    if (tag.key.startsWith("og:")) og[tag.key] = urlKeys.has(tag.key) ? resolveUrl(tag.content, finalUrl) : tag.content;
    if (tag.key.startsWith("twitter:")) twitter[tag.key] = urlKeys.has(tag.key) ? resolveUrl(tag.content, finalUrl) : tag.content;
  }
  const title = textTitle(html);
  const description = content("description");
  const canonical = resolveUrl(linkHref(html, "canonical"), finalUrl);
  const robots = content("robots");
  const icon = resolveUrl(linkHref(html, "icon") || linkHref(html, "shortcut icon"), finalUrl);
  const apple = resolveUrl(linkHref(html, "apple-touch-icon"), finalUrl);
  const jsonLdTypes = [...new Set(jsonLdBlocks(html).flatMap((block) => block.types))];
  const outline = headings(html);
  const checks: MetaCheck[] = [
    lengthCheck("Title", title, 15, 60, true),
    lengthCheck("Description", description, 50, 160, true),
    { level: canonical ? "pass" : "warn", label: "Canonical", detail: canonical || "Missing." },
    { level: robots.toLowerCase().includes("noindex") ? "fail" : "pass", label: "Robots", detail: robots || "Indexable." },
    { level: og["og:title"] ? "pass" : "warn", label: "og:title", detail: og["og:title"] || "Missing." },
    { level: og["og:description"] ? "pass" : "warn", label: "og:description", detail: og["og:description"] || "Missing." },
    { level: og["og:image"] ? "pass" : "fail", label: "og:image", detail: og["og:image"] || "Missing. Previews will have no image." },
    { level: og["og:url"] ? "pass" : "warn", label: "og:url", detail: og["og:url"] || "Missing." },
    { level: twitter["twitter:card"] ? "pass" : "warn", label: "twitter:card", detail: twitter["twitter:card"] || "X will fall back to Open Graph." },
    { level: jsonLdTypes.length ? "pass" : "warn", label: "JSON-LD", detail: jsonLdTypes.join(", ") || "No types found." },
    { level: outline.some((item) => item.level === 1) ? "pass" : "warn", label: "H1", detail: outline.find((item) => item.level === 1)?.text || "No H1." },
  ];
  return {
    finalUrl,
    title,
    description,
    canonical,
    robots,
    viewport: content("viewport"),
    lang: htmlLang(html),
    themeColor: content("theme-color"),
    og,
    twitter,
    icons: [icon, apple].filter(Boolean),
    jsonLdTypes,
    checks,
  };
}

function lengthCheck(label: string, value: string, min: number, max: number, required: boolean): MetaCheck {
  if (!value) return { level: required ? "fail" : "warn", label, detail: "Missing." };
  if (value.length < min || value.length > max) return { level: "warn", label, detail: `${value.length} characters. Usual range is ${min}–${max}.` };
  return { level: "pass", label, detail: `${value.length} characters. ${value}` };
}

export type TagDraft = {
  title: string;
  description: string;
  url: string;
  image: string;
  siteName: string;
  card: "summary" | "summary_large_image";
};

export function tagsFromDraft(draft: TagDraft) {
  const meta = [
    `<title>${escapeText(draft.title)}</title>`,
    `<meta name="description" content="${escapeAttr(draft.description)}" />`,
    `<link rel="canonical" href="${escapeAttr(draft.url)}" />`,
    `<meta property="og:title" content="${escapeAttr(draft.title)}" />`,
    `<meta property="og:description" content="${escapeAttr(draft.description)}" />`,
    `<meta property="og:url" content="${escapeAttr(draft.url)}" />`,
    `<meta property="og:image" content="${escapeAttr(draft.image)}" />`,
    `<meta property="og:site_name" content="${escapeAttr(draft.siteName)}" />`,
    `<meta name="twitter:card" content="${draft.card}" />`,
    `<meta name="twitter:title" content="${escapeAttr(draft.title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(draft.description)}" />`,
    `<meta name="twitter:image" content="${escapeAttr(draft.image)}" />`,
  ].join("\n");
  const next = `export const metadata = {
  title: ${JSON.stringify(draft.title)},
  description: ${JSON.stringify(draft.description)},
  alternates: { canonical: ${JSON.stringify(draft.url)} },
  openGraph: {
    title: ${JSON.stringify(draft.title)},
    description: ${JSON.stringify(draft.description)},
    url: ${JSON.stringify(draft.url)},
    siteName: ${JSON.stringify(draft.siteName)},
    images: [${JSON.stringify(draft.image)}],
  },
  twitter: {
    card: ${JSON.stringify(draft.card)},
    title: ${JSON.stringify(draft.title)},
    description: ${JSON.stringify(draft.description)},
    images: [${JSON.stringify(draft.image)}],
  },
};
`;
  return { meta, next };
}

function escapeAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function escapeText(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}
