import { z } from "zod";
import { dialects, explainCron } from "@/tools/cron-expression-builder/lib/cron";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  expression: z.string().describe("A cron expression, including @daily or @reboot."),
  dialect: z.enum(dialects).default("standard"),
  timeZone: z.string().default("UTC").describe("IANA time zone used to list the next runs. Hosted schedules stay in UTC."),
  now: z.string().optional().describe("ISO timestamp used as the clock. Omit it to use the current time."),
});

export const outputSchema = z.object({
  valid: z.boolean(),
  english: z.string(),
  error: z.string(),
  fields: z.array(z.object({ name: z.string(), value: z.string() })),
  runs: z.array(z.object({ utc: z.string() })),
  snippets: z.array(z.object({ label: z.string(), code: z.string() })),
  hostedNote: z.string(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const now = parsed.now ? new Date(parsed.now) : new Date();
  if (Number.isNaN(now.getTime())) throw new Error("now must be an ISO timestamp.");
  const result = explainCron(parsed.expression, parsed.dialect, parsed.timeZone, now);
  return outputSchema.parse({
    valid: result.valid,
    english: result.english,
    error: result.error,
    fields: result.fields,
    runs: result.runs.map((runAt) => ({ utc: runAt.utc })),
    snippets: result.snippets,
    hostedNote: result.hostedNote,
  });
}

export const tool: BenchTool = {
  slug: "cron-expression-builder",
  name: "explain_cron",
  title: "Explain a cron expression",
  description: "Turn a cron expression into English, the next UTC run times, and snippets for crontab, GitHub Actions, Vercel, Kubernetes, and node-cron.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
