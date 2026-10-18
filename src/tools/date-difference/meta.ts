import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "date-difference",
  name: "Date difference calculator",
  tagline: "Count the days, weeks, and business days between two dates.",
  description:
    "Free date calculator for the exact days between two dates. See the calendar span, elapsed time, weeks, and business days with weekends and your own holiday list excluded. Runs in the browser.",
  category: "developer",
  tags: ["date", "calendar"],
  keywords: ["days between dates", "date calculator", "business days calculator"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "CalendarRange",
  related: ["unix-timestamp", "cron-expression-builder", "hash-generator", "password-generator"],
  faqs: [
    { q: "Does the count include the end date?", a: "Not unless you turn on Count the end date. From 1 January to 3 January is 2 days between, or 3 days when the end date is included." },
    { q: "What is a business day here?", a: "A weekday that is not in the holiday list. Saturday and Sunday are weekends. A holiday that falls on a weekend is not subtracted twice." },
    { q: "Which country's holidays are built in?", a: "None. Paste the dates you care about, one YYYY-MM-DD per line, so company holidays and local holidays stay under your control." },
    { q: "Are the dates sent to a server?", a: "No. The count is computed in the browser." },
  ],
  seo: {
    title: "Date difference calculator",
    description: "Count days between dates, with an option for business days that skips weekends and holidays you list.",
  },
  howTo: [
    { name: "Enter the start and end", text: "Use calendar dates. Add times when you need hours and minutes, otherwise both start at midnight." },
    { name: "Choose whether the end date counts", text: "Leave it off for the gap between the dates. Turn it on for an inclusive stay or a business-day count." },
    { name: "Add holidays if you need business days", text: "One YYYY-MM-DD per line. The business-day total skips weekends and those weekdays." },
  ],
  inputs: "Start and end dates, optional times, an inclusive-end switch, and a holiday list.",
  outputs: "Calendar span, elapsed time, total days, weeks, business days, weekend days, and weekday holidays.",
  runsLocally: true,
  badges: ["Calendar · Business days"],
} satisfies ToolMeta;
