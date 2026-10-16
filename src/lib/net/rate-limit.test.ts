import { describe, expect, it } from "vitest";
import { rateLimit, resetRateLimit } from "@/lib/net/rate-limit";

describe("rateLimit", () => {
  it("allows eight calls and then asks the caller to wait", () => {
    resetRateLimit();
    for (let i = 0; i < 8; i += 1) {
      expect(rateLimit("ip", 8, 600_000, 1_000).ok).toBe(true);
    }
    const blocked = rateLimit("ip", 8, 600_000, 1_000);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.retryAfter).toBeGreaterThan(0);
  });
});
