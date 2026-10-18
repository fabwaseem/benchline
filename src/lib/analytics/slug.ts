import { getTool } from "@/registry";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function parseSlug(value: string | null | undefined): string | null {
  if (!value) return null;
  const slug = value.trim().toLowerCase();
  if (slug.length > 80 || !SLUG.test(slug)) return null;
  return slug;
}

export function isRegisteredSlug(slug: string): boolean {
  return Boolean(getTool(slug));
}

export function toolSlugFromPath(pathname: string): string | null {
  const match = /^\/t\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/.exec(pathname);
  const slug = match?.[1];
  if (!slug || !isRegisteredSlug(slug)) return null;
  return slug;
}

const API_TOOL_SLUGS: Record<string, string> = {
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

export function slugFromApiPath(pathname: string): string | null {
  const slug = API_TOOL_SLUGS[pathname];
  if (!slug || !isRegisteredSlug(slug)) return null;
  return slug;
}
