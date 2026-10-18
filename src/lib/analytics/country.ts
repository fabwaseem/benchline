const HEADER_NAMES = [
  "cf-ipcountry",
  "x-vercel-ip-country",
  "cloudfront-viewer-country",
  "x-country-code",
  "x-appengine-country",
];

const SKIPPED = new Set(["XX", "T1", "A1", "A2", "O1"]);

export function countryCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || SKIPPED.has(code)) return null;
  return code;
}

/** ISO code only. Names and addresses on the record are ignored. */
export function countryFromRecord(record: unknown): string | null {
  if (!record || typeof record !== "object") return null;
  const row = record as {
    country?: { iso_code?: unknown };
    registered_country?: { iso_code?: unknown };
    country_code?: unknown;
  };
  return (
    countryCode(row.country?.iso_code) ??
    countryCode(row.registered_country?.iso_code) ??
    countryCode(row.country_code)
  );
}

export function countryFromHeaders(headers: { get(name: string): string | null }): string | null {
  for (const name of HEADER_NAMES) {
    const code = countryCode(headers.get(name));
    if (code) return code;
  }
  return null;
}

/**
 * The DB-IP lookup is the source of country. A CDN header is used only when
 * that lookup has no answer, so a later Cloudflare hop can still fill it in.
 */
export function countryFor(
  ip: string | null,
  headers: { get(name: string): string | null },
  lookup: (ip: string) => string | null,
): string | null {
  if (ip) {
    try {
      const lookedUp = lookup(ip);
      if (lookedUp) return lookedUp;
    } catch {
      return countryFromHeaders(headers);
    }
  }
  return countryFromHeaders(headers);
}
