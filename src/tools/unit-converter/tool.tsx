"use client";

import { useState } from "react";
import { ArrowLeftRight, Ruler } from "lucide-react";
import { ActionButton, Select, TextInput } from "@/components/kit/controls";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar, Truncate } from "@/components/kit/shell";
import { convertUnits, unitCategories, unitsIn, type CategoryId } from "@/tools/unit-converter/lib/units";

export default function UnitConverterTool() {
  const [category, setCategory] = useState<CategoryId>("length");
  const [from, setFrom] = useState("m");
  const [to, setTo] = useState("ft");
  const [value, setValue] = useState("1");
  const [precision, setPrecision] = useState("4");
  const units = unitsIn(category);
  const places = Number(precision);
  const result = convertUnits(category, from, to, value, Number.isFinite(places) ? Math.trunc(places) : 4);
  const failed = "error" in result;
  const target = units.find((unit) => unit.id === to);

  function chooseCategory(next: CategoryId) {
    const list = unitsIn(next);
    setCategory(next);
    setFrom(list[0]?.id ?? "");
    setTo(list[1]?.id ?? list[0]?.id ?? "");
  }

  return (
    <ToolCard>
      <ToolToolbar
        label="Category"
        options={unitCategories.map((item) => ({ value: item.id, label: item.label }))}
        value={category}
        onChange={chooseCategory}
        actions={
          <ActionButton variant="outline" size="sm" onClick={() => { setFrom(to); setTo(from); }}>
            <ArrowLeftRight size={14} />
            Swap
          </ActionButton>
        }
      />
      <ToolPanes>
        <Pane label="Convert">
          <FieldRow label="Value" htmlFor="unit-value">
            <TextInput id="unit-value" inputMode="decimal" value={value} onChange={(event) => setValue(event.target.value)} />
          </FieldRow>
          <FieldRow label="From" htmlFor="unit-from">
            <Select id="unit-from" value={from} onChange={(event) => setFrom(event.target.value)}>
              {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.label}</option>)}
            </Select>
          </FieldRow>
          <FieldRow label="To" htmlFor="unit-to">
            <Select id="unit-to" value={to} onChange={(event) => setTo(event.target.value)}>
              {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.label}</option>)}
            </Select>
          </FieldRow>
          <FieldRow label="Decimal places" htmlFor="unit-precision" help="0 to 12. Half up.">
            <TextInput id="unit-precision" inputMode="numeric" value={precision} onChange={(event) => setPrecision(event.target.value)} />
          </FieldRow>
        </Pane>
        <Pane label={target?.label ?? "Result"}>
          <div aria-live="polite" className="flex flex-col gap-3">
            {failed ? (
              <>
                <Notice tone="bad" role="alert" title={result.error} />
                <EmptyState art={<Ruler size={22} />} title="No conversion" hint="Use a unit from the selected category." />
              </>
            ) : (
              <>
                <ResultStat variant="well" label={`${from} to ${to}`} value={result.result} />
                <ul>
                  {result.rows.map((row) => (
                    <li key={row.id} className="flex items-baseline justify-between gap-3 border-t border-border py-2 text-[13px]">
                      <span className="text-muted-foreground whitespace-nowrap">{row.label}</span>
                      <Truncate value={row.value} className="text-right font-mono tabular-nums" />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip note={failed ? result.error : `${value || "0"} ${from} = ${result.result} ${to}`} tone={failed ? "fail" : "pass"} />
    </ToolCard>
  );
}
