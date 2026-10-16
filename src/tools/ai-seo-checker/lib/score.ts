import { accessFor, parseRobots, type RobotsDocument } from "@/lib/robots";

export type Check = { id: string; level: "pass" | "warn" | "fail"; label: string; detail: string; weight: number };

export type SeoFacts = {
  finalUrl: string;
  status: number;
  elapsedMs: number;
  title: string;
  description: string;
  canonical: string;
  robotsMeta: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  headings: { level: number; text: string }[];
  lead: string;
  jsonLdTypes: string[];
  llmsStatus: number;
  sitemapFound: boolean;
  robots: RobotsDocument | null;
};

const ALLOW = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "PerplexityBot", "Google-Extended", "CCBot", "Applebot-Extended"];

export function scoreSeo(facts: SeoFacts): { score: number; checks: Check[] } {
  const checks: Check[] = [];
  const https = facts.finalUrl.startsWith("https://");
  checks.push(row("https", https ? "pass" : "fail", "HTTPS", https ? "The final URL is https." : "The final URL is not https.", 8));
  checks.push(
    row(
      "time",
      facts.elapsedMs < 800 ? "pass" : facts.elapsedMs < 2000 ? "warn" : "fail",
      "Response time",
      `The page responded in ${facts.elapsedMs} ms.`,
      4,
    ),
  );
  checks.push(lengthRow("title", "Title", facts.title, 15, 60, 8, "Missing title."));
  checks.push(lengthRow("description", "Meta description", facts.description, 50, 160, 6, "Missing meta description."));
  checks.push(row("canonical", facts.canonical ? "pass" : "warn", "Canonical", facts.canonical || "No canonical link.", 4));
  const robots = facts.robotsMeta.toLowerCase();
  checks.push(
    row(
      "robots-meta",
      robots.includes("noindex") ? "fail" : "pass",
      "Robots meta",
      robots ? facts.robotsMeta : "No robots meta tag, so the page is indexable.",
      6,
    ),
  );
  checks.push(row("og-title", facts.ogTitle ? "pass" : "warn", "og:title", facts.ogTitle || "Missing og:title.", 4));
  checks.push(row("og-description", facts.ogDescription ? "pass" : "warn", "og:description", facts.ogDescription || "Missing og:description.", 3));
  checks.push(row("og-image", facts.ogImage ? "pass" : "fail", "og:image", facts.ogImage || "Missing og:image.", 6));
  const h1 = facts.headings.filter((heading) => heading.level === 1);
  checks.push(
    row(
      "h1",
      h1.length === 1 ? "pass" : h1.length === 0 ? "fail" : "warn",
      "H1",
      h1.length === 1 ? h1[0]!.text : h1.length === 0 ? "No H1." : `${h1.length} H1 headings.`,
      5,
    ),
  );
  const skipped = facts.headings.some((heading, index) => index > 0 && heading.level > facts.headings[index - 1]!.level + 1);
  checks.push(row("outline", skipped ? "warn" : "pass", "Heading order", skipped ? "A heading skips a level." : "Heading levels do not skip.", 3));
  checks.push(
    row(
      "lead",
      facts.lead.length > 40 && facts.lead.length < 400 ? "pass" : facts.lead ? "warn" : "fail",
      "Answer-first lead",
      facts.lead ? `Opening paragraph is ${facts.lead.length} characters.` : "No opening paragraph.",
      5,
    ),
  );
  checks.push(
    row(
      "jsonld",
      facts.jsonLdTypes.length > 0 ? "pass" : "warn",
      "JSON-LD",
      facts.jsonLdTypes.length > 0 ? facts.jsonLdTypes.join(", ") : "No JSON-LD types.",
      6,
    ),
  );
  checks.push(row("llms", facts.llmsStatus === 200 ? "pass" : "warn", "llms.txt", facts.llmsStatus === 200 ? "Found /llms.txt." : ` /llms.txt returned ${facts.llmsStatus || "nothing"}.`, 6));
  checks.push(row("sitemap", facts.sitemapFound ? "pass" : "warn", "Sitemap", facts.sitemapFound ? "A sitemap URL was found." : "No sitemap URL was found.", 5));

  if (!facts.robots) {
    checks.push(row("robots-file", "warn", "robots.txt", "No robots.txt file. Crawlers treat that as allow all.", 6));
  } else {
    for (const agent of ALLOW) {
      const access = accessFor(facts.robots, agent);
      checks.push(
        row(
          agent,
          access === "disallow" ? "fail" : "pass",
          agent,
          access === "disallow" ? `${agent} is disallowed.` : `${agent} is allowed or not blocked.`,
          3,
        ),
      );
    }
    const bytes = accessFor(facts.robots, "Bytespider");
    checks.push(
      row(
        "Bytespider",
        bytes === "disallow" ? "pass" : bytes === "unspecified" ? "warn" : "fail",
        "Bytespider",
        bytes === "disallow" ? "Bytespider is blocked." : bytes === "unspecified" ? "Bytespider is not mentioned." : "Bytespider is allowed.",
        4,
      ),
    );
  }

  const weight = checks.reduce((sum, check) => sum + check.weight, 0);
  const earned = checks.reduce((sum, check) => sum + check.weight * (check.level === "pass" ? 1 : check.level === "warn" ? 0.5 : 0), 0);
  return { score: Math.round((earned / weight) * 100), checks };
}

function row(id: string, level: Check["level"], label: string, detail: string, weight: number): Check {
  return { id, level, label, detail, weight };
}

function lengthRow(id: string, label: string, value: string, min: number, max: number, weight: number, missing: string): Check {
  if (!value) return row(id, "fail", label, missing, weight);
  if (value.length < min || value.length > max) {
    return row(id, "warn", label, `${value.length} characters. A useful range is ${min}–${max}.`, weight);
  }
  return row(id, "pass", label, `${value.length} characters.`, weight);
}

export function robotsFromText(text: string | null) {
  if (!text) return null;
  return parseRobots(text);
}
