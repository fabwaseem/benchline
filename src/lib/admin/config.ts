export const ADMIN_COOKIE = "bl_admin";
export const ADMIN_MAX_AGE_SEC = 7 * 24 * 60 * 60;

export function adminEnv(
  password = process.env.ADMIN_PASSWORD,
  secret = process.env.ADMIN_SESSION_SECRET,
): { password: string; secret: string } | null {
  if (!password || !secret) return null;
  return { password, secret };
}

export function adminConfigured(): boolean {
  return adminEnv() !== null;
}

/** Local to the admin transaction. Clamped so a bad env value cannot disable it. */
export function queryTimeoutMs(raw = process.env.ADMIN_QUERY_TIMEOUT_MS): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 8000;
  return Math.min(30_000, Math.max(1000, Math.floor(parsed)));
}

export function timeoutConfig(ms = queryTimeoutMs()): { text: string; values: [string] } {
  return { text: "select set_config('statement_timeout', $1, true)", values: [`${ms}ms`] };
}
