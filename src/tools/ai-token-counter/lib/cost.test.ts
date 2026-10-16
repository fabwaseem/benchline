import { describe, expect, it } from "vitest";
import { priceRequest } from "@/tools/ai-token-counter/lib/cost";
import { MODELS } from "@/tools/ai-token-counter/lib/prices";

describe("priceRequest", () => {
  it("prices cached input and switches the whole request to the long-context rate", () => {
    const sol = MODELS.find((model) => model.id === "gpt-6.1-sol");
    if (!sol) throw new Error("missing model");
    const row = priceRequest({ model: sol, inputTokens: 1_000_000, outputTokens: 500, cachedRatio: 0.5, requestsPerDay: 10 });
    expect(row.inputUsd).toBeCloseTo(2.1, 5);
    expect(row.longContext).toBe(true);
    expect(row.monthUsd).toBeCloseTo(row.requestUsd * 300, 5);
  });
});
