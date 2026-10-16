import { describe, expect, it } from "vitest";
import { accessFor, parseRobots, robotsIssues } from "@/lib/robots";

const sample = `
User-agent: *
Disallow: /admin
Allow: /admin/public
Sitemap: /sitemap.xml

User-agent: GPTBot
Allow: /

User-agent: Bytespider
Disallow: /
`;

describe("parseRobots", () => {
  it("groups agents, rules, and sitemaps", () => {
    const document = parseRobots(sample);
    expect(document.groups).toHaveLength(3);
    expect(document.sitemaps).toEqual(["/sitemap.xml"]);
    expect(accessFor(document, "GPTBot")).toBe("allow");
    expect(accessFor(document, "Bytespider")).toBe("disallow");
    expect(accessFor(document, "OtherBot", "/admin")).toBe("disallow");
    expect(accessFor(document, "OtherBot", "/admin/public")).toBe("allow");
  });

  it("records Crawl-delay as an info row", () => {
    const document = parseRobots("User-agent: *\nCrawl-delay: 10\nDisallow: /admin\n");
    expect(document.groups[0]?.crawlDelay).toBe("10");
    const issues = robotsIssues(document);
    expect(issues.some((issue) => issue.level === "info" && issue.detail.includes("Major crawlers ignore Crawl-delay"))).toBe(true);
  });

  it("flags a relative sitemap and a full-site block", () => {
    const issues = robotsIssues(parseRobots(sample));
    expect(issues.some((issue) => issue.level === "fail" && issue.label.includes("absolute"))).toBe(true);
    const blocked = robotsIssues(parseRobots("User-agent: *\nDisallow: /\n"));
    expect(blocked.some((issue) => issue.level === "fail")).toBe(true);
  });
});
