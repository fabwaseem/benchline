import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "word-counter",
  name: "Word counter",
  tagline: "Words, graphemes, reading time, and the limits a title or post has to fit.",
  description:
    "Free word counter and character counter. Counts words with Intl.Segmenter, code points, graphemes, sentences, and paragraphs, then checks SEO title, meta description, X, SMS, Bluesky, and Instagram limits.",
  category: "writing",
  tags: ["text", "count"],
  keywords: ["word counter", "character count", "reading time", "meta description length"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "WholeWord",
  related: ["case-converter", "diff-checker", "ai-token-counter", "json-formatter"],
  faqs: [
    { q: "Does this upload my text?", a: "No. Counting runs in the browser. The text is not posted and it is not stored." },
    { q: "What is a character here?", a: "Characters are Unicode code points. Graphemes are what a reader sees as one character, so an emoji family counts as one grapheme and several code points." },
    { q: "How is reading time calculated?", a: "Reading time uses 238 words per minute. Speaking time uses 150. A short text rounds up to at least one second." },
    { q: "Is the X limit the official weighted count?", a: "The bars use code points. X also weights some emoji and counts every URL as 23 characters, so a post near 280 can still be over the official limit." },
  ],
  seo: {
    title: "Word and character counter",
    description: "Count words, characters, graphemes, and reading time, and check title, meta, and social limits.",
  },
  howTo: [
    { name: "Paste the text", text: "Drop a draft, a title, or a caption into the editor. Nothing is uploaded." },
    { name: "Read the counts", text: "Words, characters, graphemes, sentences, and paragraphs update as you type." },
    { name: "Check the limit bars", text: "SEO title, meta description, X, SMS, Bluesky, and Instagram each show how much of the limit is used." },
  ],
  inputs: "Text.",
  outputs: "Word, character, grapheme, sentence, and paragraph counts, reading and speaking time, and platform limit bars.",
  runsLocally: true,
  badges: ["Graphemes · Limits"],
} satisfies ToolMeta;
