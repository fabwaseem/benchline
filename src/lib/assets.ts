/** Tool artwork lives in public/tools/<slug>/ and ships with the site. */
export const COVER_SIZE = { width: 1600, height: 900 } as const;

export function toolCover(slug: string) {
  return `/tools/${slug}/cover.png`;
}

export function toolLogo(slug: string) {
  return `/tools/${slug}/logo.png`;
}
