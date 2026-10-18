import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "diff-checker",
  name: "Diff checker",
  tagline: "Compare two texts side by side or inline, and download a unified patch.",
  description:
    "Free diff checker for text and JSON. Compare by line, word, or character, ignore whitespace, or diff JSON so key order does not matter. The result is a side-by-side view, an inline view, and a unified patch. It runs in the browser.",
  category: "developer",
  tags: ["diff", "compare"],
  keywords: ["diff checker", "compare text", "text diff", "json diff"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Diff",
  related: ["json-formatter", "json-yaml-convert", "csv-json-convert", "cron-expression-builder"],
  faqs: [
    { q: "What is the difference between side by side and inline?", a: "Side by side pairs removed and added lines in two columns. Inline paints the same changes in one stream, in the order the diff found them." },
    { q: "What does ignore whitespace do?", a: "Line mode treats lines as equal when only leading or trailing whitespace differs. Word mode ignores spaces between words. Character mode removes whitespace before comparing." },
    { q: "How does the JSON diff work?", a: "Both sides must be JSON. Keys are sorted before the comparison, so a reordered object is unchanged. A value change is shown as a line diff of the canonical document. A syntax error names the side, the line, and the column." },
    { q: "Is the patch ready to apply?", a: "The unified patch uses three lines of context and the names original and changed. JSON mode patches the canonical documents, named original.json and changed.json." },
  ],
  seo: {
    title: "Diff checker",
    description: "Compare text side by side or inline. Line, word, and character diffs, ignore whitespace, and a JSON diff that ignores key order.",
  },
  howTo: [
    { name: "Paste the two texts", text: "Original goes on the left, changed on the right. Swap them if you pasted them backwards." },
    { name: "Choose how to compare", text: "Line is the default. Word and character zoom in. JSON compares values and ignores key order." },
    { name: "Read the view or the patch", text: "Switch between side by side and inline. The patch is in the side panel, ready to copy." },
  ],
  inputs: "Two texts, a mode of line, word, character, or JSON, and an ignore-whitespace toggle.",
  outputs: "A side-by-side or inline diff, added and removed counts, and a unified patch.",
  runsLocally: true,
  badges: ["Side by side · Inline · Patch"],
} satisfies ToolMeta;
