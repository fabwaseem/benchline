import type { Category } from "@/registry/schema";

export const categories = [
  {
    slug: "ai-search",
    name: "AI search",
    description:
      "Files and checks that decide what an AI crawler can fetch, cite, and skip.",
    icon: "Bot",
    hue: 185,
  },
  {
    slug: "social",
    name: "Social previews",
    description:
      "Open Graph cards, meta tags, and the picture a shared link unfurls into.",
    icon: "Share2",
    hue: 300,
  },
  {
    slug: "auth",
    name: "Auth debugging",
    description:
      "Read a JSON Web Token, check the signature, and see why a session expired.",
    icon: "KeyRound",
    hue: 150,
  },
  {
    slug: "seo",
    name: "SEO",
    description:
      "Structured data and the markup a crawler can quote without guessing.",
    icon: "Search",
    hue: 255,
  },
  {
    slug: "ai-dev",
    name: "AI dev",
    description: "Token counts and the cost of a prompt before you send it.",
    icon: "Sparkles",
    hue: 75,
  },
  {
    slug: "developer",
    name: "Developer",
    description: "Schedules and the small expressions a deploy depends on.",
    icon: "Terminal",
    hue: 200,
  },
  {
    slug: "nextjs",
    name: "Next.js",
    description: "Production files for shipping a Next.js app in a container.",
    icon: "Box",
    hue: 0,
  },
] as const satisfies readonly Category[];

export const toolOrder = [
  "llms-txt-generator",
  "ai-seo-checker",
  "og-image-generator",
  "jwt-decoder",
  "robots-txt-checker",
  "meta-tags-inspector",
  "schema-generator",
  "ai-token-counter",
  "cron-expression-builder",
  "nextjs-dockerfile-generator",
] as const;
