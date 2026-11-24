/**
 * Rules for counting a "run" on a tool page when the tool does not report runs itself.
 * Pure: the beacon collects values from the DOM and asks these functions what to do.
 */

/** Tools whose browser UI calls a server route through postTool, which reports each run exactly. */
export const TOOL_REQUEST_PATHS: Record<string, string> = {
  "/api/tools/html-markdown": "html-to-markdown-url",
  "/api/tools/http-headers": "http-headers-checker",
  "/api/tools/sitemap": "sitemap-validator",
  "/api/tools/ssl": "ssl-checker",
  "/api/tools/dns-lookup": "dns-lookup",
  "/api/tools/robots-txt": "robots-txt-checker",
  "/api/tools/ai-seo": "ai-seo-checker",
  "/api/tools/llms-txt": "llms-txt-generator",
  "/api/tools/meta-tags": "meta-tags-inspector",
};

const SELF_REPORTING = new Set(Object.values(TOOL_REQUEST_PATHS));

/** False for tools that report exact runs; guessing on top of them double counts. */
export function usesRunHeuristic(slug: string): boolean {
  return !SELF_REPORTING.has(slug);
}

/** Controls that change how a result is shown or shared, never the result itself. */
const VIEW_ONLY = /\b(copy|copied|download|clear|sample|cancel|close|reset|wrap|share|expand|collapse|show|hide|more)\b/;

export function isViewOnlyControl(label: string, role: string | null): boolean {
  if (role === "tab") return true;
  return VIEW_ONLY.test(label.toLowerCase());
}

/**
 * A short fingerprint of what the user has entered and chosen. A run is counted only when this changes,
 * so switching tabs or toggling a view after a run does not count again.
 */
export function stateFingerprint(parts: readonly string[]): string {
  let hash = 2166136261;
  let length = 0;
  for (const part of parts) {
    const text = `${part}\u0000`;
    length += text.length;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
  }
  return `${length.toString(36)}:${(hash >>> 0).toString(36)}`;
}
