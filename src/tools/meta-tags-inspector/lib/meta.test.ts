import { describe, expect, it } from "vitest";
import { inspectHtml, tagsFromDraft } from "@/tools/meta-tags-inspector/lib/meta";

const html = `<html lang="en"><head>
<title>Bench</title>
<meta name="description" content="A description that is long enough to sit inside the usual snippet range for a search result page.">
<meta name="robots" content="noindex">
<meta property="og:image" content="/card.png">
<script type="application/ld+json">{"@type":"Article"}</script>
</head><body><h1>Bench</h1></body></html>`;

describe("inspectHtml", () => {
  it("resolves the image and fails a noindex robots tag", () => {
    const result = inspectHtml(html, "https://example.com/post");
    expect(result.og["og:image"]).toBe("https://example.com/card.png");
    expect(result.jsonLdTypes).toContain("Article");
    expect(result.checks.find((check) => check.label === "Robots")?.level).toBe("fail");
    expect(tagsFromDraft({
      title: "Bench",
      description: "A card",
      url: "https://example.com",
      image: "https://example.com/card.png",
      siteName: "Benchline",
      card: "summary_large_image",
    }).next).toContain("summary_large_image");
  });
});
