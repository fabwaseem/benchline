"use client";

import { useMemo, useState } from "react";
import { Percent } from "lucide-react";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Panel, ToolShell } from "@/components/kit/tool-shell";
import { Input } from "@/components/ui/input";
import { calculatePercent, percentLabels, percentModes, type PercentMode } from "@/tools/percentage-calculator/lib/percent";

const selectClass = "h-11 w-full rounded-lg border border-input bg-transparent px-2 text-sm min-[700px]:h-8";

export default function PercentageTool() {
  const [mode, setMode] = useState<PercentMode>("of");
  const [a, setA] = useState("10");
  const [b, setB] = useState("200");
  const labels = percentLabels[mode];
  const result = useMemo(() => calculatePercent(mode, a, b), [a, b, mode]);
  const failed = "error" in result;

  return (
    <ToolShell
      runsLocally
      layout="split"
      status={
        <>
          <span className={failed ? "dot dot-warn" : "dot"} />
          <span>{failed ? result.error : labels.label}</span>
        </>
      }
      input={
        <Panel title="Values">
          <FieldRow label="Form" htmlFor="percent-mode">
            <select id="percent-mode" value={mode} onChange={(event) => setMode(event.target.value as PercentMode)} className={selectClass}>
              {percentModes.map((item) => <option key={item} value={item}>{percentLabels[item].label}</option>)}
            </select>
          </FieldRow>
          <FieldRow label={labels.a} htmlFor="percent-a">
            <Input id="percent-a" inputMode="decimal" value={a} onChange={(event) => setA(event.target.value)} />
          </FieldRow>
          <FieldRow label={labels.b} htmlFor="percent-b">
            <Input id="percent-b" inputMode="decimal" value={b} onChange={(event) => setB(event.target.value)} />
          </FieldRow>
        </Panel>
      }
      output={
        <div aria-live="polite">
          {failed ? (
            <Panel>
              <Notice tone="bad" role="alert" title={result.error} />
              <EmptyState art={<Percent size={22} />} title="No result" hint="Both fields need numbers, and a divisor cannot be zero." />
            </Panel>
          ) : (
            <Panel title="Result">
              <ResultStat variant="well" label={labels.label} value={result.unit === "percent" ? `${result.result}%` : result.result} hint={result.formula} />
              {result.parts.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {result.parts.map((part) => <ResultStat key={part.label} label={part.label} value={part.value} />)}
                </div>
              ) : null}
            </Panel>
          )}
        </div>
      }
    />
  );
}
