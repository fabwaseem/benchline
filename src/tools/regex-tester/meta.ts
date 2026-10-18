import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "regex-tester",
  name: "Regex tester",
  tagline: "Test a JavaScript pattern, read the groups, and preview a replacement.",
  description:
    "Free JavaScript regex tester. Set flags, see every match and capture group, read a short explanation of the pattern, and preview a replacement. The match list is exact, which is what an agent needs when a model guesses.",
  category: "regex",
  tags: ["regex"],
  keywords: ["regex tester", "javascript regex", "regex replace"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Regex",
  related: ["json-formatter", "sql-formatter", "base64-codec", "cron-expression-builder"],
  faqs: [
    { q: "Which engine is this?", a: "JavaScript RegExp, the same engine this page runs in. It is not PCRE. A pattern that works here works in a browser and in Node." },
    { q: "Does the global flag change the match list?", a: "The match list always searches the whole sample. The replacement preview adds the global flag when it is missing, so every match is replaced." },
    { q: "Why might a pattern stall?", a: "Some nested quantifiers make JavaScript backtrack for a long time. Samples are capped at 50,000 characters and the match list stops at 500." },
  ],
  seo: {
    title: "JavaScript regex tester",
    description: "Test a JavaScript regular expression, inspect capture groups, and preview a replacement.",
  },
  howTo: [
    { name: "Enter a pattern", text: "Type the pattern without slashes. Turn on the flags you need." },
    { name: "Paste a sample", text: "Matches are marked in the sample. Each row lists the index and the groups." },
    { name: "Preview a replacement", text: "Leave the replacement empty to skip it. $1 and $<name> work as they do in JavaScript." },
  ],
  inputs: "A JavaScript pattern, flags, a sample, and an optional replacement.",
  outputs: "Matches with indexes and groups, a short explanation, and the replaced sample.",
  runsLocally: true,
  badges: ["Groups · Replace"],
} satisfies ToolMeta;
