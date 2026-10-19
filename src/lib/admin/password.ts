import { createHash, timingSafeEqual } from "node:crypto";

/** SHA-256 both sides so the compare stays constant-time for any length. */
export function passwordsMatch(presented: string, expected: string): boolean {
  const left = createHash("sha256").update(presented, "utf8").digest();
  const right = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(left, right);
}
