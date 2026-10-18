"use client";

import { useEffect, useMemo, useState } from "react";
import { ActionButton, ChipButton, Select, TextInput } from "@/components/kit/controls";
import { Clock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CodeOutput } from "@/components/kit/code-output";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Segmented } from "@/components/kit/segmented";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { dialects, explainCron, presets, setField, type Dialect } from "@/tools/cron-expression-builder/lib/cron";

const ZONES = ["UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Karachi", "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney"];
const LIMITS: Record<string, number> = { second: 59, minute: 59, hour: 23, "day of month": 31, month: 12, "day of week": 7 };

export default function CronTool() {
  const params = useSearchParams();
  const [expr, setExpr] = useState(params.get("expr") || "0 9 * * 1-5");
  const [dialect, setDialect] = useState<Dialect>("standard");
  const [zone, setZone] = useState("Asia/Karachi");
  const [snippet, setSnippet] = useState("crontab");

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("expr") === expr) return;
    url.searchParams.set("expr", expr);
    window.history.replaceState(null, "", url);
  }, [expr]);

  const result = useMemo(() => explainCron(expr, dialect, zone), [dialect, expr, zone]);
  const zones = ZONES.includes(zone) ? ZONES : [zone, ...ZONES];
  const reboot = expr.trim() === "@reboot";
  const activeSnippet = result.snippets.find((item) => item.label === snippet) ?? result.snippets[0];

  useWorkbenchKeys({
    onCopy: () => {
      void navigator.clipboard.writeText(expr).then(() => toast.success("Expression copied"));
    },
    onEscape: () => setExpr("0 9 * * 1-5"),
  });

  const status = reboot
    ? "no calendar times"
    : result.valid
      ? `Valid · ${dialect} · ${result.fields.length} fields · ${zone}`
      : `Invalid · ${result.error}`;

  return (
    <ToolCard>
      <ToolToolbar
        actions={<ActionButton className="btn btn-ink" onClick={() => void navigator.clipboard.writeText(expr).then(() => toast.success("Expression copied"))}>Copy expression</ActionButton>}
      />
      <ToolPanes>
        <Pane label="Expression">
          <FieldRow label="Expression" htmlFor="cron" error={result.valid ? undefined : result.error} help="Minute, hour, day of month, month, day of week.">
            <TextInput id="cron" value={expr} onChange={(event) => setExpr(event.target.value)} className="font-mono max-[699px]:h-11" aria-invalid={!result.valid} />
          </FieldRow>
          {reboot ? null : (
            <div className="grid grid-cols-5 gap-2">
              {result.fields.map((field) => {
                const bad = fieldOutOfRange(field.name, field.value);
                return (
                  <div key={field.name} className={bad ? "rounded-lg border border-destructive px-2 py-2" : "rounded-lg border border-border px-2 py-2"}>
                    <p className="font-mono text-[10px] text-faint uppercase">{field.name}</p>
                    <p className="font-mono text-[18px]">{field.value || "—"}</p>
                  </div>
                );
              })}
            </div>
          )}
          <Segmented label="Dialect" value={dialect} onChange={setDialect} options={dialects.map((item) => ({ value: item, label: item }))} />
          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset) => (
              <ChipButton key={preset.id} pressed={expr === preset.expr} onClick={() => setExpr(preset.expr)}>{preset.label}</ChipButton>
            ))}
          </div>
          <FieldChips label="Minute" values={["*", "*/5", "*/15", "*/30", "0"]} onPick={(value) => setExpr(setField(expr, expr.trim().split(/\s+/).length >= 6 ? 1 : 0, value))} />
          <FieldChips label="Hour" values={["*", "0", "9", "12", "18"]} onPick={(value) => setExpr(setField(expr, expr.trim().split(/\s+/).length >= 6 ? 2 : 1, value))} />
          <FieldChips label="Weekday" values={["*", "1-5", "1", "0"]} onPick={(value) => setExpr(setField(expr, expr.trim().split(/\s+/).length >= 6 ? 5 : 4, value))} />
          <FieldRow label="Timezone" htmlFor="cron-tz">
            <Select id="cron-tz" value={zone} onChange={(event) => setZone(event.target.value)}>
              {zones.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </FieldRow>
        </Pane>
        <Pane label={reboot ? "English" : result.valid ? "Next runs" : "Error"}>
          <div aria-live="polite" className="flex min-h-[240px] flex-col gap-3">
            {reboot ? (
              <Notice tone="warn" title="Run once when the machine starts. This is not a calendar schedule." />
            ) : result.valid ? (
              <>
                <p className="text-[16px] font-medium tracking-[-0.02em]">{result.english}</p>
                <ul className="text-sm">
                  {result.runs.map((run) => (
                    <li key={run.utc} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-t border-border py-2">
                      <span className="truncate" title={run.local}>{run.local}</span>
                      <span className="truncate font-mono text-[12px] text-muted-foreground" title={`${run.utc} UTC`}>{run.utc} UTC</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <Notice tone="bad" role="alert" title={result.error || "That expression is not valid."} />
                <EmptyState art={<Clock size={22} />} title="No runs" hint="Fix the field that is out of range." />
              </>
            )}
            {result.valid && activeSnippet ? (
              <>
                <Segmented label="Snippet" value={activeSnippet.label} onChange={setSnippet} options={result.snippets.map((item) => ({ value: item.label, label: item.label }))} />
                <CodeOutput code={activeSnippet.code} label={activeSnippet.label} fill />
                <Notice tone="warn" title="GitHub Actions and Vercel Cron run in UTC." />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Snippets wait for a valid expression.</p>
            )}
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip note={status} tone={result.valid ? "pass" : "warn"} trailing="⌘⇧C copy expression · esc reset" />
    </ToolCard>
  );
}

function FieldChips({ label, values, onPick }: { label: string; values: string[]; onPick: (value: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-16 text-[12px] text-muted-foreground">{label}</span>
      {values.map((value) => (
        <ChipButton key={value} className="font-mono" onClick={() => onPick(value)}>{value}</ChipButton>
      ))}
    </div>
  );
}

function fieldOutOfRange(name: string, value: string) {
  if (!value || value === "*" || /[*/,-]/.test(value)) return false;
  const limit = LIMITS[name];
  if (limit === undefined) return false;
  const number = Number(value);
  return Number.isFinite(number) && (number < 0 || number > limit);
}
