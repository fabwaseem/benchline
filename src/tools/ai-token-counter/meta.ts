import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "ai-token-counter",
  name: "AI token counter",
  tagline: "Count tokens and estimate the API cost of a prompt for GPT, Claude, and Gemini models.",
  description:
    "Free LLM token counter and API cost calculator. Paste text to count tokens with OpenAI's tokenizers and estimate input and output cost across GPT, Claude, Gemini, and other models.",
  category: "ai-dev",
  tags: ["tokens", "llm"],
  keywords: ["token counter", "LLM token counter", "OpenAI token counter", "tiktoken", "AI cost calculator"],
  status: "new",
  createdAt: "2026-09-20",
  updatedAt: "2026-10-16",
  icon: "Coins",
  related: ["schema-generator", "llms-txt-generator", "jwt-decoder", "cron-expression-builder"],
  faqs: [
    { q: "What is a token?", a: "A token is the unit an LLM bills and reads. In English, one token is about 4 characters or about three quarters of a word. Other languages and code often use more tokens for the same text." },
    { q: "Why do counts differ between models?", a: "Each family has its own encoding. This tool counts OpenAI text with o200k_base and can show cl100k_base. Other providers are not the same encoding." },
    { q: "Are Claude and Gemini counts exact?", a: "No. Claude and Gemini do not publish a browser tokenizer. Their counts are an estimate equal to the o200k_base count. Use the provider's count-tokens API when you need an exact number." },
    { q: "How is cost calculated?", a: "Input and output are priced separately, per million tokens. Cached input uses the cache-read rate when the model has one. A request over a model's long-context threshold uses that model's higher rate for the whole request. Monthly cost is the request cost times requests per day times 30." },
    { q: "Is my text uploaded?", a: "No. Counting and the cost table run locally in your browser. The tokenizer loads as a cacheable worker. The text is not sent to this site." },
    { q: "When were prices updated?", a: "The date under the cost table is 2026-10-16, when these rates were copied from the providers' pricing pages. Open the cited links to confirm the current rate before you budget a large workload." },
  ],
  seo: {
    title: "AI token counter",
    description: "Count tokens with OpenAI's tokenizers and estimate input and output cost across GPT, Claude, Gemini, and other models.",
  },
  howTo: [
    { name: "Paste your prompt or file", text: "Drop a .txt, .md, or .json file, or paste the prompt. The count updates in the browser." },
    { name: "Pick models and expected output", text: "Choose the models to compare, set the output tokens you expect back, and the cached-input share." },
    { name: "Compare cost per request and per month", text: "The table prices input and output separately. Copy it as markdown when you want to keep the estimate." },
  ],
  inputs: "Prompt text or a text file, selected models, expected output tokens, requests per day, and a cached-input share.",
  outputs: "Token, character, and word counts, a token boundary preview, and a cost table per model.",
  runsLocally: true,
  badges: ["11 models · prices 2026-10-16"],
} satisfies ToolMeta;
