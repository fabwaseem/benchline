import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "jsonpath-tester",
  name: "JSONPath tester",
  tagline: "Query JSON with JSONPath Plus and inspect every match.",
  description:
    "Free JSONPath tester. Paste a JSON document, write a JSONPath Plus query, and see each match with its path and a count. Syntax mistakes are reported with the position, and filters, slices, unions, and recursive descent all work.",
  category: "json",
  tags: ["jsonpath", "json", "query"],
  keywords: ["jsonpath tester", "jsonpath online", "json query", "jsonpath plus", "test jsonpath expression"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "FileJson",
  related: ["json-formatter", "json-yaml-convert", "json-schema-validate"],
  faqs: [
    { q: "Which JSONPath dialect is this?", a: "JSONPath Plus, the most widely used JavaScript implementation. It supports filters like [?(@.price < 10)], slices like [0:2], unions, recursive descent with .., and script expressions." },
    { q: "Why does my query return nothing?", a: "Check the root: queries start with $. Property names are case sensitive, and array indexes start at 0. The syntax check flags unbalanced brackets and quotes." },
    { q: "Is my JSON sent anywhere?", a: "No. Evaluation runs in the browser with the document you pasted." },
    { q: "What does the path column show?", a: "The normalized path of each match, like $['store']['book'][0]['author'], so you can see exactly where a value came from." },
  ],
  seo: {
    title: "JSONPath tester",
    description: "Test JSONPath Plus queries against your JSON in the browser. See matches, paths, counts, and clear syntax errors.",
  },
  howTo: [
    { name: "Paste your JSON", text: "Drop a JSON document into the left pane. Invalid JSON is flagged immediately." },
    { name: "Write the query", text: "Start with $ and use dot or bracket notation. Try $.store.book[*].author or a filter like $.store.book[?(@.price < 10)]." },
    { name: "Read the matches", text: "Each match shows its value and its full path. Large result sets are truncated at 500 with the total count kept." },
  ],
  inputs: "A JSON document and a JSONPath Plus query.",
  outputs: "Matching values with their normalized paths, the total count, and syntax errors with positions.",
  runsLocally: true,
  badges: ["JSONPath Plus"],
} satisfies ToolMeta;
