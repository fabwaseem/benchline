import { createRateLimit, type RateResult } from "@/lib/analytics/rate-limit";

const WINDOW_MS = 15 * 60 * 1000;
const LIMIT = 5;

const loginLimit = createRateLimit(LIMIT, WINDOW_MS);

export function checkLoginLimit(key: string, now = Date.now()): RateResult {
  return loginLimit.check(key, now);
}

export function resetLoginLimit() {
  loginLimit.reset();
}

export const LOGIN_LIMIT = LIMIT;
export const LOGIN_WINDOW_MS = WINDOW_MS;
