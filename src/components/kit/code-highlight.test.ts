import { describe, expect, it } from "vitest";
import { highlightCode, languageFor, PLAIN_BYTE_LIMIT, shouldHighlight } from "@/components/kit/code-highlight";

describe("code highlight", () => {
  it("maps filenames and labels onto the bundled languages", () => {
    expect(languageFor("opengraph-image.tsx")).toBe("tsx");
    expect(languageFor("converted.yaml", "YAML")).toBe("yaml");
    expect(languageFor("Dockerfile", "Dockerfile")).toBe("dockerfile");
    expect(languageFor(undefined, "GitHub Actions")).toBe("yaml");
    expect(languageFor(undefined, "node-cron")).toBe("javascript");
    expect(languageFor("llms.txt", "llms.txt")).toBe("markdown");
    expect(languageFor("robots.txt")).toBe("ini");
    expect(languageFor(undefined, "regex")).toBe("regexp");
    expect(languageFor("notes.txt")).toBe("plaintext");
  });

  it("skips highlighting past 200 KB", () => {
    expect(shouldHighlight("{\"a\": 1}")).toBe(true);
    expect(shouldHighlight("a".repeat(PLAIN_BYTE_LIMIT + 1))).toBe(false);
  });

  it("colors json with both themes without re-tokenizing the grammar", async () => {
    const lines = await highlightCode('{"name": "Benchline"}', "json");
    expect(lines?.length).toBe(1);
    const colored = lines?.[0]?.find((token) => token.content.includes("Benchline"));
    expect(colored?.variants.light?.color).toMatch(/^#/);
    expect(colored?.variants.dark?.color).toMatch(/^#/);
    expect(colored?.variants.light?.color).not.toBe(colored?.variants.dark?.color);
  });
});
