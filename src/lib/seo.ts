/** Search titles stay under this length once the " · Benchline" template is added. */
export const TITLE_BUDGET = 60;
const TEMPLATE_SUFFIX = " · Benchline".length;

/**
 * A tool's <title>: its SEO title plus the words people search with ("free online tool"),
 * but only when the whole title still fits in a search result and the words are not already there.
 */
export function toolTitle(seoTitle: string): string {
  const base = seoTitle.trim();
  if (/\b(free|online)\b/i.test(base)) return base;
  const withIntent = `${base}: free online tool`;
  return withIntent.length + TEMPLATE_SUFFIX <= TITLE_BUDGET ? withIntent : base;
}

/** The plain-Markdown copy of a tool page, for agents and LLM crawlers. */
export function toolMarkdownPath(slug: string): string {
  return `/t/${slug}.md`;
}
