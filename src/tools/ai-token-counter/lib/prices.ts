export const PRICES_UPDATED = "2026-10-16";

export type TokenizerKind = "o200k" | "cl100k" | "estimate";

export type PriceModel = {
  id: string;
  provider: string;
  label: string;
  inputPerM: number;
  outputPerM: number;
  cachedInputPerM?: number;
  contextWindow: number | null;
  tokenizer: TokenizerKind;
  note: string;
  source: string;
  longContext?: { afterInputTokens: number; inputPerM: number; cachedInputPerM?: number; outputPerM: number };
};

const OPENAI = "https://developers.openai.com/api/docs/pricing";
const ANTHROPIC = "https://platform.claude.com/docs/en/about-claude/pricing";
const DEEPSEEK = "https://api-docs.deepseek.com/quick_start/pricing";

export const MODELS: PriceModel[] = [
  { id: "gpt-6-astra", provider: "OpenAI", label: "GPT-6 Astra", inputPerM: 10, cachedInputPerM: 1, outputPerM: 50, contextWindow: 1_050_000, tokenizer: "o200k", note: "Short-context standard rate. Above 272K input tokens the whole request uses the long-context rate.", source: OPENAI, longContext: { afterInputTokens: 272_000, inputPerM: 20, cachedInputPerM: 2, outputPerM: 75 } },
  { id: "gpt-6.1-sol", provider: "OpenAI", label: "GPT-6.1 Sol", inputPerM: 2, cachedInputPerM: 0.1, outputPerM: 10, contextWindow: 1_050_000, tokenizer: "o200k", note: "Short-context standard rate. Above 272K input tokens the whole request uses the long-context rate.", source: OPENAI, longContext: { afterInputTokens: 272_000, inputPerM: 4, cachedInputPerM: 0.2, outputPerM: 15 } },
  { id: "gpt-6-luna", provider: "OpenAI", label: "GPT-6 Luna", inputPerM: 0.1, cachedInputPerM: 0.01, outputPerM: 0.5, contextWindow: 1_050_000, tokenizer: "o200k", note: "Short-context standard rate. Above 272K input tokens the whole request uses the long-context rate.", source: OPENAI, longContext: { afterInputTokens: 272_000, inputPerM: 0.2, cachedInputPerM: 0.02, outputPerM: 0.75 } },
  { id: "claude-fable-5-1", provider: "Anthropic", label: "Claude Fable 5.1", inputPerM: 10, cachedInputPerM: 0.25, outputPerM: 50, contextWindow: 1_000_000, tokenizer: "estimate", note: "Cache-hit rate is 0.025× input. Count is an o200k estimate, not Claude's tokenizer.", source: ANTHROPIC },
  { id: "claude-opus-5-5", provider: "Anthropic", label: "Claude Opus 5.5", inputPerM: 4, cachedInputPerM: 0.2, outputPerM: 20, contextWindow: 1_000_000, tokenizer: "estimate", note: "Cache-hit rate is 0.05× input. Count is an o200k estimate, not Claude's tokenizer.", source: ANTHROPIC },
  { id: "claude-sonnet-5-5", provider: "Anthropic", label: "Claude Sonnet 5.5", inputPerM: 2, cachedInputPerM: 0.1, outputPerM: 10, contextWindow: 1_000_000, tokenizer: "estimate", note: "Cache-hit rate is 0.05× input. Count is an o200k estimate, not Claude's tokenizer.", source: ANTHROPIC },
  { id: "claude-haiku-5-5", provider: "Anthropic", label: "Claude Haiku 5.5", inputPerM: 0.1, cachedInputPerM: 0.01, outputPerM: 0.5, contextWindow: 1_000_000, tokenizer: "estimate", note: "Rate for prompts up to 100K tokens. Longer prompts use the higher rate for the whole request. Count is an o200k estimate.", source: ANTHROPIC, longContext: { afterInputTokens: 100_000, inputPerM: 0.5, cachedInputPerM: 0.05, outputPerM: 2.5 } },
  { id: "gemini-4-argon", provider: "Google", label: "Gemini 4 Argon", inputPerM: 2, cachedInputPerM: 0.1, outputPerM: 10, contextWindow: null, tokenizer: "estimate", note: "Standard paid tier through 30 Nov 2026. From 1 Dec 2026 the page lists $4 input, $20 output, and $0.10 cache. Count is an o200k estimate.", source: "https://ai.google.dev/gemini-api/docs/pricing" },
  { id: "deepseek-v4-pro", provider: "DeepSeek", label: "DeepSeek V4 Pro", inputPerM: 1.32, cachedInputPerM: 0.044, outputPerM: 3.96, contextWindow: 1_000_000, tokenizer: "estimate", note: "Peak cache-miss input and peak output. Off-peak is $0.66 input, $0.022 cache hit, $1.98 output. Count is an o200k estimate.", source: DEEPSEEK },
  { id: "deepseek-flash", provider: "DeepSeek", label: "DeepSeek V4.1 Flash", inputPerM: 0.3, cachedInputPerM: 0.006, outputPerM: 1.2, contextWindow: 1_000_000, tokenizer: "estimate", note: "Peak cache-miss input and peak output. Off-peak is $0.15 input, $0.003 cache hit, $0.60 output. Count is an o200k estimate.", source: DEEPSEEK },
  { id: "mistral-large", provider: "Mistral", label: "Mistral Large", inputPerM: 0.5, outputPerM: 1.5, contextWindow: null, tokenizer: "estimate", note: "Uncached rate from the pricing page. Cached input is described as up to 90% off, so this table does not apply a cache discount. Count is an o200k estimate.", source: "https://mistral.ai/pricing" },
];

export const DEFAULT_MODEL_IDS = ["gpt-6.1-sol", "claude-sonnet-5-5", "gemini-4-argon"];
