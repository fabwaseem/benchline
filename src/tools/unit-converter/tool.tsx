"use client";

import { useState } from "react";
import { ArrowLeftRight, Ruler } from "lucide-react";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Panel, ToolShell } from "@/components/kit/tool-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { convertUnits, unitCategories, unitsIn, type CategoryId } from "@/tools/unit-converter/lib/units";

const selectClass = "h-11 w-full rounded-lg border border-input bg-transparent px-2 text-sm min-[700px]:h-8";

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
    <ToolShell
      runsLocally
      layout="split"
      status={
        <>
          <span className={failed ? "dot dot-warn" : "dot"} />
          <span>{failed ? result.error : `${value || "0"} ${from} = ${result.result} ${to}`}</span>
        </>
      }
      input={
        <Panel title="Convert">
          <FieldRow label="Category" htmlFor="unit-category">
            <select id="unit-category" value={category} onChange={(event) => chooseCategory(event.target.value as CategoryId)} className={selectClass}>
              {unitCategories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </FieldRow>
          <FieldRow label="Value" htmlFor="unit-value">
            <Input id="unit-value" inputMode="decimal" value={value} onChange={(event) => setValue(event.target.value)} />
          </FieldRow>
          <FieldRow label="From" htmlFor="unit-from">
            <select id="unit-from" value={from} onChange={(event) => setFrom(event.target.value)} className={selectClass}>
              {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.label}</option>)}
            </select>
          </FieldRow>
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => { setFrom(to); setTo(from); }}>
            <ArrowLeftRight size={14} />
            Swap
          </Button>
          <FieldRow label="To" htmlFor="unit-to">
            <select id="unit-to" value={to} onChange={(event) => setTo(event.target.value)} className={selectClass}>
              {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.label}</option>)}
            </select>
          </FieldRow>
          <FieldRow label="Decimal places" htmlFor="unit-precision" help="0 to 12. Half up.">
            <Input id="unit-precision" inputMode="numeric" value={precision} onChange={(event) => setPrecision(event.target.value)} />
          </FieldRow>
        </Panel>
      }
      output={
        <div aria-live="polite">
          {failed ? (
            <Panel>
              <Notice tone="bad" role="alert" title={result.error} />
              <EmptyState art={<Ruler size={22} />} title="No conversion" hint="Use a unit from the selected category." />
            </Panel>
          ) : (
            <Panel title={target?.label ?? "Result"}>
              <ResultStat variant="well" label={`${from} to ${to}`} value={result.result} />
              <ul>
                {result.rows.map((row) => (
                  <li key={row.id} className="flex items-baseline justify-between gap-3 border-t border-border py-2 text-[13px]">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-mono tabular-nums">{row.value}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      }
    />
  );
}
