import { CronExpressionParser } from "cron-parser";
import cronstrue from "cronstrue";

export const dialects = ["standard", "seconds", "quartz", "hosted"] as const;
export type Dialect = (typeof dialects)[number];

export const presets = [
  { id: "minute", label: "Every minute", expr: "* * * * *" },
  { id: "5", label: "Every 5 min", expr: "*/5 * * * *" },
  { id: "15", label: "Every 15 min", expr: "*/15 * * * *" },
  { id: "30", label: "Every 30 min", expr: "*/30 * * * *" },
  { id: "hourly", label: "Hourly", expr: "0 * * * *" },
  { id: "midnight", label: "Daily at midnight", expr: "0 0 * * *" },
  { id: "weekdays", label: "Weekdays at 9", expr: "0 9 * * 1-5" },
  { id: "weekly", label: "Monday", expr: "0 9 * * 1" },
  { id: "monthly", label: "1st of the month", expr: "0 0 1 * *" },
  { id: "daily", label: "@daily", expr: "@daily" },
  { id: "reboot", label: "@reboot", expr: "@reboot" },
] as const;

const FIELD_NAMES = ["minute", "hour", "day of month", "month", "day of week"];

export type CronResult = {
  valid: boolean;
  english: string;
  error: string;
  fields: { name: string; value: string }[];
  runs: { utc: string; local: string; relative: string }[];
  snippets: { label: string; code: string }[];
  hostedNote: string;
};

export function explainCron(expression: string, dialect: Dialect, timeZone: string, now = new Date()): CronResult {
  const expr = expression.trim();
  const hostedNote = dialect === "hosted" ? "GitHub Actions and Vercel Cron run in UTC." : "";
  if (expr === "@reboot") {
    return {
      valid: true,
      english: "Run once when the machine starts. This is not a calendar schedule.",
      error: "",
      fields: [],
      runs: [],
      snippets: snippets("@reboot"),
      hostedNote,
    };
  }
  const normalized = normalize(expr);
  try {
    const english = cronstrue.toString(normalized, {
      throwExceptionOnParseError: true,
      use24HourTimeFormat: true,
      verbose: true,
    });
    const parsed = CronExpressionParser.parse(normalized, { currentDate: now, tz: timeZone || "UTC" });
    const runs = parsed.take(10).map((date) => {
      const value = date.toDate();
      return {
        utc: formatIn(value, "UTC"),
        local: formatIn(value, timeZone || "UTC"),
        relative: relative(value, now),
      };
    });
    return {
      valid: true,
      english,
      error: "",
      fields: fieldRows(normalized),
      runs,
      snippets: snippets(fiveField(normalized)),
      hostedNote,
    };
  } catch (error) {
    return {
      valid: false,
      english: "",
      error: error instanceof Error ? error.message : "Invalid expression",
      fields: fieldRows(expr),
      runs: [],
      snippets: [],
      hostedNote,
    };
  }
}

function normalize(expr: string) {
  if (expr.startsWith("@")) return expr;
  const parts = expr.split(/\s+/);
  if (parts.length === 5) return expr;
  return expr;
}

function fiveField(expr: string) {
  if (expr.startsWith("@")) return expr;
  const parts = expr.split(/\s+/);
  if (parts.length >= 6) return parts.slice(1, 6).join(" ");
  return parts.slice(0, 5).join(" ");
}

function fieldRows(expr: string) {
  if (expr.startsWith("@")) return [{ name: "macro", value: expr }];
  const parts = expr.split(/\s+/).filter(Boolean);
  const names = parts.length >= 6 ? ["second", ...FIELD_NAMES] : FIELD_NAMES;
  return names.map((name, index) => ({ name, value: parts[index] ?? "" }));
}

export function snippets(expr: string) {
  return [
    { label: "crontab", code: `${expr} /usr/bin/example` },
    { label: "GitHub Actions", code: `on:\n  schedule:\n    - cron: "${expr}"` },
    { label: "vercel.json", code: JSON.stringify({ crons: [{ path: "/api/cron", schedule: expr }] }, null, 2) },
    { label: "Kubernetes CronJob", code: `spec:\n  schedule: "${expr}"` },
    { label: "node-cron", code: `import cron from "node-cron";\n\ncron.schedule("${expr}", () => {\n  // work\n});\n` },
  ];
}

export function setField(expr: string, index: number, value: string) {
  const parts = expr.trim().split(/\s+/);
  const width = Math.max(parts.length, 5);
  while (parts.length < width) parts.push("*");
  parts[index] = value;
  return parts.join(" ");
}

function formatIn(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function relative(date: Date, now: Date) {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return `in ${abs}s`;
  if (abs < 3600) return `in ${Math.round(abs / 60)}m`;
  if (abs < 86400) return `in ${Math.round(abs / 3600)}h`;
  return `in ${Math.round(abs / 86400)}d`;
}
