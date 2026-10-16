"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { CodeOutput } from "@/components/kit/code-output";
import { FieldRow } from "@/components/kit/field-row";
import { ResultStat } from "@/components/kit/result-stat";
import { Segmented } from "@/components/kit/segmented";
import { ToolShell } from "@/components/kit/tool-shell";
import { Input } from "@/components/ui/input";
import { dialects, explainCron, presets, setField, type Dialect } from "@/tools/cron-expression-builder/lib/cron";

const ZONES = ["UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney"];

function subscribeZone() {
  return () => {};
}

function browserZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export default function CronTool() {
  const params = useSearchParams();
  const [expr, setExpr] = useState(params.get("expr") || "*/5 * * * *");
  const [dialect, setDialect] = useState<Dialect>("standard");
  const detected = useSyncExternalStore(subscribeZone, browserZone, () => "UTC");
  const [override, setOverride] = useState<string | null>(null);
  const zone = override ?? detected;

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("expr") === expr) return;
    url.searchParams.set("expr", expr);
    window.history.replaceState(null, "", url);
  }, [expr]);

  const result = useMemo(() => explainCron(expr, dialect, zone), [dialect, expr, zone]);
  const zones = zone && !ZONES.includes(zone) ? [zone, ...ZONES] : ZONES;

  return (
    <ToolShell runsLocally>
      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <FieldRow label="Expression" htmlFor="cron" error={result.valid ? undefined : result.error} help={result.hostedNote}>
            <Input id="cron" value={expr} onChange={(event) => setExpr(event.target.value)} className="font-mono" aria-invalid={!result.valid} />
          </FieldRow>
          <Segmented label="Dialect" value={dialect} onChange={setDialect} options={dialects.map((item) => ({ value: item, label: item }))} />
          <div className="flex gap-1 overflow-x-auto">
            {presets.map((preset) => (
              <button key={preset.id} type="button" onClick={() => setExpr(preset.expr)} className="shrink-0 rounded-full border border-border px-2 py-1 text-xs">{preset.label}</button>
            ))}
          </div>
          <FieldRow label="Minute" htmlFor="cron-minute">
            <div className="flex gap-1 overflow-x-auto">
              {["*", "*/5", "*/15", "*/30", "0"].map((value) => (
                <button key={value} type="button" className="shrink-0 rounded-md border border-border px-2 py-1 font-mono text-xs" onClick={() => setExpr(setField(expr, expr.trim().split(/\s+/).length >= 6 ? 1 : 0, value))}>{value}</button>
              ))}
            </div>
          </FieldRow>
          <FieldRow label="Hour" htmlFor="cron-hour">
            <div className="flex gap-1 overflow-x-auto">
              {["*", "0", "9", "12", "18"].map((value) => (
                <button key={value} type="button" className="shrink-0 rounded-md border border-border px-2 py-1 font-mono text-xs" onClick={() => setExpr(setField(expr, expr.trim().split(/\s+/).length >= 6 ? 2 : 1, value))}>{value}</button>
              ))}
            </div>
          </FieldRow>
          <FieldRow label="Weekday" htmlFor="cron-dow">
            <div className="flex gap-1 overflow-x-auto">
              {["*", "1-5", "1", "0"].map((value) => (
                <button key={value} type="button" className="shrink-0 rounded-md border border-border px-2 py-1 font-mono text-xs" onClick={() => setExpr(setField(expr, expr.trim().split(/\s+/).length >= 6 ? 5 : 4, value))}>{value}</button>
              ))}
            </div>
          </FieldRow>
          <FieldRow label="Timezone" htmlFor="cron-tz">
            <select id="cron-tz" value={zone} onChange={(event) => setOverride(event.target.value)} className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm">
              {zones.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </FieldRow>
        </div>
        <div className="flex flex-col gap-3" aria-live="polite">
          <ResultStat label={result.valid ? "Valid" : "Invalid"} value={result.valid ? "Yes" : "No"} hint={result.english || result.error} />
          <ul className="text-sm">
            {result.runs.map((run) => (
              <li key={run.utc} className="flex justify-between gap-3 border-t border-border py-1.5">
                <span>{run.local}</span>
                <span className="text-muted-foreground">{run.relative} · {run.utc} UTC</span>
              </li>
            ))}
          </ul>
          <table className="text-sm">
            <tbody>
              {result.fields.map((field) => (
                <tr key={field.name} className="border-t border-border">
                  <td className="py-1 pr-3 text-muted-foreground">{field.name}</td>
                  <td className="font-mono">{field.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.snippets.map((snippet) => (
            <CodeOutput key={snippet.label} code={snippet.code} label={snippet.label} />
          ))}
        </div>
      </div>
    </ToolShell>
  );
}
