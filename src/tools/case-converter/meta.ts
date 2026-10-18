import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "case-converter",
  name: "Case converter",
  tagline: "camelCase, snake_case, and title case, including AP and Chicago rules.",
  description:
    "Free text case converter. See lower, upper, sentence, capital, AP title case, Chicago title case, camelCase, PascalCase, snake_case, CONSTANT_CASE, kebab-case, and the rest at once.",
  category: "writing",
  tags: ["text", "case"],
  keywords: ["case converter", "camel case converter", "title case"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "CaseSensitive",
  related: ["word-counter", "diff-checker", "base64-codec", "url-codec"],
  faqs: [
    { q: "How does AP title case differ from Chicago?", a: "AP capitalizes words of four or more letters, so from and with are capitalized. Chicago lowercases prepositions of four letters or fewer, so from stays lowercase. Both capitalize the first and last word." },
    { q: "Does camelCase keep line breaks?", a: "Yes. Each non-empty line is converted on its own, so a list of names stays a list." },
    { q: "Which words stay lowercase in a title?", a: "Articles, coordinating conjunctions, and short prepositions, unless the word is first or last. Hyphenated parts follow the same list." },
  ],
  seo: {
    title: "Text case converter",
    description: "Convert text to camelCase, snake_case, kebab-case, and AP or Chicago title case.",
  },
  howTo: [
    { name: "Paste a phrase", text: "Type a sentence or one identifier per line." },
    { name: "Read every case", text: "Lower, upper, title case, and the identifier cases update together." },
    { name: "Copy the one you need", text: "Each row has its own copy button." },
  ],
  inputs: "Text.",
  outputs: "The same text in lower, upper, sentence, capital, AP, Chicago, camel, Pascal, snake, constant, kebab, dot, path, train, alternating, and inverse case.",
  runsLocally: true,
  badges: ["AP · Chicago"],
} satisfies ToolMeta;
