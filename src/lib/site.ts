export const SITE_URL = "https://tools.fabwaseem.com";
export const SITE_NAME = "Toolsmith";

export function absoluteUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
