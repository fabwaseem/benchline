export const categoryTone: Record<string, string> = {
  "ai-search": "bg-cat-ai-search/15 text-cat-ai-search",
  seo: "bg-cat-seo/15 text-cat-seo",
  social: "bg-cat-social/15 text-cat-social",
  auth: "bg-cat-auth/15 text-cat-auth",
  ai: "bg-cat-ai/15 text-cat-ai",
  developer: "bg-cat-developer/15 text-cat-developer",
  nextjs: "bg-cat-nextjs/15 text-cat-nextjs",
};

export function toneFor(category: string) {
  return categoryTone[category] ?? "bg-muted text-muted-foreground";
}
