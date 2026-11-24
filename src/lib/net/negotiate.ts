const TOOL_PAGE = /^\/t\/([a-z0-9-]+)$/;

/**
 * When an agent asks a tool page for Markdown (Accept lists text/markdown ahead of text/html, or without it),
 * the Markdown copy of that page is where to send it. Returns that path, or null to serve the page as usual.
 */
export function markdownRewrite(pathname: string, method: string, accept: string | null): string | null {
  if (method !== "GET" && method !== "HEAD") return null;
  const match = TOOL_PAGE.exec(pathname);
  if (!match || !accept) return null;
  const value = accept.toLowerCase();
  const markdown = value.indexOf("text/markdown");
  if (markdown === -1) return null;
  const html = value.indexOf("text/html");
  if (html !== -1 && html < markdown) return null;
  return `/md/${match[1]}`;
}
