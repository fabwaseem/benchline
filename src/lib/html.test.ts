import { describe, expect, it } from "vitest";
import { headings, jsonLdBlocks, parseMetaTags, textTitle } from "@/lib/html";

const fixture = `<!doctype html><html lang="en"><head>
<title>Bench &amp; Co</title>
<meta name="description" content="A short answer first.">
<meta property="og:image" content="/card.png">
<link rel="canonical" href="https://example.com/post">
<script type="application/ld+json">{"@type":"Article","author":{"@type":"Person","name":"Ada"}}</script>
</head><body><h1>Bench</h1><h3>Skipped</h3><p>Answer first, then the rest.</p></body></html>`;

describe("html parsing", () => {
  it("reads title, meta, headings, and JSON-LD types", () => {
    expect(textTitle(fixture)).toBe("Bench & Co");
    expect(parseMetaTags(fixture)).toEqual([
      { key: "description", content: "A short answer first." },
      { key: "og:image", content: "/card.png" },
    ]);
    expect(headings(fixture).map((heading) => heading.level)).toEqual([1, 3]);
    expect(jsonLdBlocks(fixture)[0]?.types).toEqual(["Article", "Person"]);
  });
});
