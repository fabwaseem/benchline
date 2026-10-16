import { describe, expect, it } from "vitest";
import { exploreTools, type ExploreTool } from "@/lib/explore";

const tools: ExploreTool[] = [
  { slug: "jwt-decoder", name: "JWT decoder", tagline: "Read a token", category: "auth", tags: ["jwt"], updatedAt: "2026-10-01", icon: "KeyRound" },
  { slug: "cron-expression-builder", name: "Cron expression builder", tagline: "Next runs", category: "developer", tags: ["cron"], updatedAt: "2026-10-16", icon: "Clock" },
  { slug: "ai-token-counter", name: "AI token counter", tagline: "Count tokens", category: "ai-dev", tags: ["tokens", "ai"], updatedAt: "2026-09-01", icon: "Coins" },
];

const names: Record<string, string> = { auth: "Auth debugging", developer: "Developer", "ai-dev": "AI dev" };

describe("exploreTools", () => {
  it("filters by query, category, and tag, then sorts by name", () => {
    expect(exploreTools(tools, { query: "token", category: "all", tag: "all", sort: "name" }).map((tool) => tool.slug)).toEqual([
      "ai-token-counter",
      "jwt-decoder",
    ]);
    expect(exploreTools(tools, { query: "", category: "auth", tag: "jwt", sort: "name" }).map((tool) => tool.slug)).toEqual(["jwt-decoder"]);
  });

  it("sorts by updated date, then by category name", () => {
    expect(exploreTools(tools, { query: "", category: "all", tag: "all", sort: "updated" }).map((tool) => tool.slug)).toEqual([
      "cron-expression-builder",
      "jwt-decoder",
      "ai-token-counter",
    ]);
    expect(exploreTools(tools, { query: "", category: "all", tag: "all", sort: "category" }, (slug) => names[slug] ?? slug).map((tool) => tool.slug)).toEqual([
      "ai-token-counter",
      "jwt-decoder",
      "cron-expression-builder",
    ]);
  });
});
