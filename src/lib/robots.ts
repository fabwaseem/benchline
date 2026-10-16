export type RobotGroup = {
  agents: string[];
  allow: string[];
  disallow: string[];
  crawlDelay?: string;
};

export type RobotsDocument = {
  groups: RobotGroup[];
  sitemaps: string[];
};

export type RobotsIssue = {
  level: "pass" | "warn" | "fail" | "info";
  label: string;
  detail: string;
};

export function parseRobots(text: string): RobotsDocument {
  const groups: RobotGroup[] = [];
  const sitemaps: string[] = [];
  let current: RobotGroup | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const split = line.indexOf(":");
    if (split === -1) continue;
    const field = line.slice(0, split).trim().toLowerCase();
    const value = line.slice(split + 1).trim();
    if (field === "user-agent") {
      if (!current || current.allow.length > 0 || current.disallow.length > 0 || current.crawlDelay) {
        current = { agents: [], allow: [], disallow: [] };
        groups.push(current);
      }
      current.agents.push(value);
    } else if (field === "allow") {
      current ??= pushGroup(groups);
      current.allow.push(value);
    } else if (field === "disallow") {
      current ??= pushGroup(groups);
      current.disallow.push(value);
    } else if (field === "crawl-delay") {
      current ??= pushGroup(groups);
      current.crawlDelay = value;
    } else if (field === "sitemap" && value) {
      sitemaps.push(value);
    }
  }

  return { groups: groups.filter((group) => group.agents.length > 0), sitemaps };
}

function pushGroup(groups: RobotGroup[]) {
  const group = { agents: ["*"], allow: [], disallow: [] };
  groups.push(group);
  return group;
}

export function sitemapUrls(text: string) {
  return parseRobots(text).sitemaps;
}

function groupFor(document: RobotsDocument, agent: string) {
  const name = agent.toLowerCase();
  const specific = document.groups.find((group) =>
    group.agents.some((item) => item.toLowerCase() === name),
  );
  if (specific) return specific;
  return document.groups.find((group) => group.agents.some((item) => item === "*"));
}

export function accessFor(document: RobotsDocument, agent: string, path = "/"): "allow" | "disallow" | "unspecified" {
  const group = groupFor(document, agent);
  if (!group) return "unspecified";
  const rules = [
    ...group.disallow.map((rule) => ({ rule, allow: false })),
    ...group.allow.map((rule) => ({ rule, allow: true })),
  ].filter((rule) => rule.rule.length > 0);
  if (rules.length === 0) return "allow";
  let winner: { length: number; allow: boolean } | null = null;
  for (const rule of rules) {
    if (!pathMatches(rule.rule, path)) continue;
    if (!winner || rule.rule.length > winner.length || (rule.rule.length === winner.length && rule.allow)) {
      winner = { length: rule.rule.length, allow: rule.allow };
    }
  }
  if (!winner) return "allow";
  return winner.allow ? "allow" : "disallow";
}

function pathMatches(rule: string, path: string) {
  if (rule === "/") return true;
  const escaped = rule.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}`).test(path);
}

export function robotsIssues(document: RobotsDocument, options?: { html?: boolean; status?: number }): RobotsIssue[] {
  const issues: RobotsIssue[] = [];
  if (options?.status === 404) {
    issues.push({
      level: "info",
      label: "No robots.txt",
      detail: "A 404 means there is no file. Crawlers treat that as allow all.",
    });
    return issues;
  }
  if (options?.html) {
    issues.push({
      level: "fail",
      label: "Response is HTML",
      detail: "The URL returned a web page instead of a robots.txt file.",
    });
  }
  const star = document.groups.find((group) => group.agents.includes("*"));
  if (star?.disallow.some((rule) => rule === "/")) {
    issues.push({
      level: "fail",
      label: "User-agent * disallows the whole site",
      detail: "Disallow: / under the wildcard group asks every polite crawler to skip the site.",
    });
  } else {
    issues.push({
      level: "pass",
      label: "Wildcard group does not block the site",
      detail: "User-agent * does not disallow every path.",
    });
  }
  if (document.sitemaps.length === 0) {
    issues.push({
      level: "warn",
      label: "No Sitemap line",
      detail: "Add an absolute Sitemap URL so crawlers can find the URL list.",
    });
  }
  for (const sitemap of document.sitemaps) {
    if (!/^https?:\/\//i.test(sitemap)) {
      issues.push({
        level: "fail",
        label: "Sitemap is not absolute",
        detail: `${sitemap} must be an absolute URL. A path such as /sitemap.xml is not a valid Sitemap line.`,
      });
    } else {
      issues.push({
        level: "pass",
        label: "Sitemap is absolute",
        detail: sitemap,
      });
    }
  }
  for (const group of document.groups) {
    if (!group.crawlDelay) continue;
    issues.push({
      level: "info",
      label: "Crawl-delay",
      detail: `${group.agents.join(", ") || "*"} sets Crawl-delay: ${group.crawlDelay}. Major crawlers ignore Crawl-delay.`,
    });
  }
  if (document.groups.length === 0 && !options?.html) {
    issues.push({
      level: "warn",
      label: "No user-agent groups",
      detail: "The file does not name a user-agent, so crawlers have no rules to follow.",
    });
  }
  return issues;
}
