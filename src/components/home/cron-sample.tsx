"use client";

import { explainCron } from "@/tools/cron-expression-builder/lib/cron";

const expression = "*/15 9-17 * * 1-5";

export function CronSample() {
  const cron = explainCron(expression, "standard", "UTC", new Date("2026-10-19T08:00:00Z"));
  return (
    <>
      <div className="mt-4 font-mono text-[20px] tracking-[-0.03em]">{expression}</div>
      <p className="mt-1 text-[13px] text-muted-foreground">{cron.valid ? cron.english : cron.error}</p>
      <div className="mt-3.5 border-l border-border-strong">
        {cron.runs.slice(0, 3).map((run, index) => (
          <div key={run.utc} className="relative flex gap-3 py-1 pl-3.5 font-mono text-[12.5px]">
            <span
              className="absolute top-[11px] -left-1 size-[7px] rounded-full"
              style={{
                background: index === 0 ? "var(--accent-brand)" : "var(--surface)",
                boxShadow: index === 0 ? undefined : "0 0 0 1.5px var(--fg2)",
              }}
            />
            <span>{run.utc.slice(11, 16)}</span>
            <span className="text-faint">{run.utc.slice(0, 10)}</span>
          </div>
        ))}
      </div>
    </>
  );
}
