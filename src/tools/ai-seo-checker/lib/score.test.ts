import { describe, expect, it } from "vitest";
import { parseRobots } from "@/lib/robots";
import { scoreSeo, seoVerdict } from "@/tools/ai-seo-checker/lib/score";

describe("scoreSeo", () => {
  it("scores a complete page higher than a bare http page", () => {
    const rich = scoreSeo({
      finalUrl: "https://example.com/post",
      status: 200,
      elapsedMs: 120,
      title: "A clear title for the bench",
      description: "A description long enough to summarize the page without spilling past the usual snippet length.",
      canonical: "https://example.com/post",
      robotsMeta: "index,follow",
      ogTitle: "A clear title",
      ogDescription: "A description",
      ogImage: "https://example.com/card.png",
      headings: [{ level: 1, text: "Title" }, { level: 2, text: "Next" }],
      lead: "This opening paragraph answers the question before the rest of the page expands on it.",
      jsonLdTypes: ["Article"],
      llmsStatus: 200,
      sitemapFound: true,
      robots: parseRobots("User-agent: *\nAllow: /\nUser-agent: Bytespider\nDisallow: /\n"),
    });
    const bare = scoreSeo({
      finalUrl: "http://example.com",
      status: 200,
      elapsedMs: 4000,
      title: "",
      description: "",
      canonical: "",
      robotsMeta: "noindex",
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      headings: [],
      lead: "",
      jsonLdTypes: [],
      llmsStatus: 404,
      sitemapFound: false,
      robots: null,
    });
    expect(rich.score).toBeGreaterThan(bare.score);
    expect(bare.checks.find((check) => check.id === "robots-meta")?.level).toBe("fail");
    expect(seoVerdict(bare.score, bare.checks)).toBe("Needs work");
    expect(seoVerdict(78, [{ level: "fail" }, { level: "warn" }])).toBe("Good, with two fixes");
  });
});
