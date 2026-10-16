export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://tools.fabwaseem.com").replace(/\/$/, "");
export const SITE_NAME = "Benchline";
export const GITHUB_URL = "https://github.com/fabwaseem/benchline";
export const MAKER_URL = "https://fabwaseem.com";

export function absoluteUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
