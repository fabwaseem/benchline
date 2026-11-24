import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

const PRIVATE = ["/kit", "/admin", "/api/admin"];

/**
 * AI search and assistant crawlers, named so their access is explicit rather than implied by "*".
 * Every tool is meant to be found, read, and called by agents.
 */
const AI_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "Bingbot",
  "DuckAssistBot",
  "Amazonbot",
  "meta-externalagent",
  "MistralAI-User",
  "cohere-ai",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_AGENTS, allow: ["/", "/llms.txt", "/llms-full.txt", "/openapi.json", "/md/"], disallow: PRIVATE },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
