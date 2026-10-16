import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "cron-expression-builder",
  name: "Cron expression builder",
  tagline: "Build or paste a cron schedule, read it in plain English, and see the next run times.",
  description:
    "Free cron expression generator and explainer. Build a schedule visually or paste one to translate it into plain English, validate it, and preview the next 10 run times in any timezone. Supports standard 5-field cron, seconds, Quartz, and macros.",
  category: "developer",
  tags: ["cron", "scheduling"],
  keywords: ["cron expression generator", "cron translator", "crontab", "cron validator", "vercel cron"],
  status: "new",
  createdAt: "2026-09-20",
  updatedAt: "2026-10-16",
  icon: "Clock",
  related: ["nextjs-dockerfile-generator", "jwt-decoder", "robots-txt-checker", "schema-generator"],
  faqs: [
    { q: "What does */5 * * * * mean?", a: "In a 5-field expression it means minute 0, 5, 10, and so on, every hour, every day. The schedule fires every 5 minutes." },
    { q: "What is the order of the 5 fields?", a: "Minute, hour, day of month, month, day of week. Ranges are 0-59, 0-23, 1-31, 1-12, and 0-7 where both 0 and 7 are Sunday." },
    { q: "What is the difference between standard cron and Quartz?", a: "Quartz adds a seconds field and uses ? when day-of-month or day-of-week should be left unset. It also supports L, W, and #. Standard 5-field cron does not." },
    { q: "What timezone do GitHub Actions and Vercel Cron use?", a: "UTC. A schedule of 0 9 * * 1-5 runs at 09:00 UTC, which is not 9am in every local timezone." },
    { q: "How do I run every weekday at 9am?", a: "Use 0 9 * * 1-5. That is minute 0, hour 9, Monday through Friday. Set the timezone here to the zone you mean, and remember hosted crons stay on UTC." },
    { q: "How do day-of-month and day-of-week combine?", a: "In standard cron, if both are restricted, the job runs when either matches. That is OR, not AND. Quartz avoids the ambiguity by setting one of them to ?." },
  ],
  seo: {
    title: "Cron expression builder",
    description: "Build a cron schedule or paste one to read it in English, validate it, and preview the next 10 runs in any timezone.",
  },
  howTo: [
    { name: "Pick a preset or build fields", text: "Start from a preset or set minute, hour, day, month, and weekday. The expression stays in sync with the fields." },
    { name: "Read the English and check the next runs", text: "The sentence and the next 10 times use the timezone you pick. Compare them with UTC before you deploy." },
    { name: "Copy for crontab, GitHub Actions, Vercel, or Kubernetes", text: "Each snippet is ready to paste. GitHub Actions and Vercel Cron stay on UTC." },
  ],
  inputs: "A cron expression, a dialect, a timezone, and field chips for minute, hour, day, month, and weekday.",
  outputs: "Plain English, the next 10 runs, a field breakdown, and snippets for crontab, GitHub Actions, Vercel, Kubernetes, and node-cron.",
  runsLocally: true,
} satisfies ToolMeta;
