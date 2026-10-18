"use client";

import { useMemo, useState } from "react";
import { Percent } from "lucide-react";
import { TextInput } from "@/components/kit/controls";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { calculatePercent, percentLabels, percentModes, type PercentMode } from "@/tools/percentage-calculator/lib/percent";

export default function PercentageTool() {
  const [mode, setMode] = useState<PercentMode>("of");
  const [a, setA] = useState("10");
  const [b, setB] = useState("200");
  const labels = percentLabels[mode];
  const result = useMemo(() => calculatePercent(mode, a, b), [a, b, mode]);
  const failed = "error" in result;

  return (
    <ToolCard>
      <ToolToolbar
        label="Form"
        options={percentModes.map((item) => ({ value: item, label: percentLabels[item].label }))}
        value={mode}
        onChange={setMode}
      />
      <ToolPanes>
        <Pane label="Values">
          <FieldRow label={labels.a} htmlFor="percent-a">
            <TextInput id="percent-a" inputMode="decimal" value={a} onChange={(event) => setA(event.target.value)} />
          </FieldRow>
          <FieldRow label={labels.b} htmlFor="percent-b">
            <TextInput id="percent-b" inputMode="decimal" value={b} onChange={(event) => setB(event.target.value)} />
          </FieldRow>
        </Pane>
        <Pane label="Result">
          <div aria-live="polite" className="flex flex-col gap-3">
            {failed ? (
              <>
                <Notice tone="bad" role="alert" title={result.error} />
                <EmptyState art={<Percent size={22} />} title="No result" hint="Both fields need numbers, and a divisor cannot be zero." />
              </>
            ) : (
              <>
                <ResultStat variant="well" label={labels.label} value={result.unit === "percent" ? `${result.result}%` : result.result} hint={result.formula} />
                {result.parts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {result.parts.map((part) => <ResultStat key={part.label} label={part.label} value={part.value} />)}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip note={failed ? result.error : result.formula} tone={failed ? "fail" : "pass"} />
    </ToolCard>
  );
}
