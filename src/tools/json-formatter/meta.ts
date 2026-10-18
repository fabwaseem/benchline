import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "json-formatter",
  name: "JSON formatter",
  tagline: "Pretty-print, minify, and validate JSON, with the exact line and column when it fails.",
  description:
    "Free JSON formatter and JSON validator that runs in the browser. Choose an indent of 2, 4, or a tab, sort object keys, minify, and read a tree of the value. Invalid JSON reports the line, the column, and the line of source.",
  category: "developer",
  tags: ["json", "format", "validate"],
  keywords: ["json formatter", "json validator", "json minify", "json pretty print"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Braces",
  related: ["json-yaml-convert", "csv-json-convert", "base64-codec", "jwt-decoder"],
  faqs: [
    { q: "Does this upload my JSON?", a: "No. Formatting and validation run in the browser. The document is not posted and it is not stored." },
    { q: "How exact is the error position?", a: "The parser reports the first problem at a line and column, counted from 1, plus the source line. A trailing comma, a comment, and a truncated value each get their own position." },
    { q: "What does sort keys change?", a: "Object keys are ordered by UTF-16 code unit. Array order stays as written. Nested objects are sorted too." },
    { q: "Will comments or trailing commas pass?", a: "No. This checks strict JSON. Comments and trailing commas are reported as errors instead of being stripped." },
  ],
  seo: {
    title: "JSON formatter and validator",
    description: "Pretty-print, minify, and validate JSON in the browser. Errors include the exact line and column.",
  },
  howTo: [
    { name: "Paste JSON", text: "Drop a payload, a config file, or a response body into the editor. Nothing is uploaded." },
    { name: "Pick pretty or minify", text: "Pretty uses 2 spaces, 4 spaces, or a tab. Minify removes the insignificant whitespace. Sort keys when you want a stable order." },
    { name: "Read the error or the tree", text: "An invalid document names the line and column. A valid one can be copied, downloaded, or opened as a tree." },
  ],
  inputs: "JSON text, an indent of 2, 4, or tab, and toggles for minify and sort keys.",
  outputs: "Formatted or minified JSON, a tree of the value, or the line and column of the first syntax error.",
  runsLocally: true,
  badges: ["Pretty · Minify · Line and column"],
} satisfies ToolMeta;
