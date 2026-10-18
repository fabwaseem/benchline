"use client";

import { useEffect, useState } from "react";
import { Dices } from "lucide-react";
import { CodeOutput } from "@/components/kit/code-output";
import { ActionButton, Select, TextInput } from "@/components/kit/controls";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Segmented } from "@/components/kit/segmented";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { defaultFields, fieldKinds, fieldLabels, generateLorem, generateRows, type FakeField, type LoremKind, type OutputFormat } from "@/tools/lorem-ipsum/lib/generate";

export default function LoremIpsumTool() {
  const [tab, setTab] = useState<"lorem" | "rows">("lorem");
  const [kind, setKind] = useState<LoremKind>("paragraphs");
  const [count, setCount] = useState("3");
  const [rows, setRows] = useState("8");
  const [seed, setSeed] = useState("1");
  const [format, setFormat] = useState<OutputFormat>("json");
  const [table, setTable] = useState("records");
  const [fields, setFields] = useState<FakeField[]>(defaultFields);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const next = tab === "lorem"
            ? await generateLorem(kind, numberOr(count, 3), numberOr(seed, 1))
            : await generateRows(fields, numberOr(rows, 8), numberOr(seed, 1), format, table);
          if (!cancelled) {
            setOutput(next);
            setError("");
          }
        } catch (caught) {
          if (!cancelled) {
            setOutput("");
            setError(caught instanceof Error ? caught.message : "Could not generate that sample.");
          }
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [count, fields, format, kind, rows, seed, tab, table]);

  const filename = tab === "lorem" ? "lorem.txt" : format === "json" ? "records.json" : format === "csv" ? "records.csv" : "records.sql";

  return (
    <ToolCard>
      <ToolToolbar
        label="Mode"
        options={[{ value: "lorem", label: "Lorem" }, { value: "rows", label: "Rows" }]}
        value={tab}
        onChange={setTab}
      />
      <ToolPanes>
        <Pane label={tab === "lorem" ? "Length" : "Fields"}>
          <FieldRow label="Seed" htmlFor="lorem-seed" help="The same seed rebuilds the same sample.">
            <TextInput id="lorem-seed" inputMode="numeric" value={seed} onChange={(event) => setSeed(event.target.value)} />
          </FieldRow>
          {tab === "lorem" ? (
            <>
              <Segmented label="Unit" value={kind} onChange={setKind} options={[{ value: "words", label: "Words" }, { value: "sentences", label: "Sentences" }, { value: "paragraphs", label: "Paragraphs" }]} />
              <FieldRow label="Count" htmlFor="lorem-count">
                <TextInput id="lorem-count" inputMode="numeric" value={count} onChange={(event) => setCount(event.target.value)} />
              </FieldRow>
            </>
          ) : (
            <>
              <FieldRow label="Rows" htmlFor="lorem-rows">
                <TextInput id="lorem-rows" inputMode="numeric" value={rows} onChange={(event) => setRows(event.target.value)} />
              </FieldRow>
              <FieldRow label="SQL table" htmlFor="lorem-table">
                <TextInput id="lorem-table" value={table} onChange={(event) => setTable(event.target.value)} spellCheck={false} />
              </FieldRow>
              <Segmented label="Format" value={format} onChange={setFormat} options={[{ value: "json", label: "JSON" }, { value: "csv", label: "CSV" }, { value: "sql", label: "SQL" }]} />
              <ul className="flex flex-col gap-2">
                {fields.map((field, index) => (
                  <li key={`${field.name}-${index}`} className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
                    <TextInput aria-label={`Field ${index + 1} name`} value={field.name} onChange={(event) => updateField(index, { name: event.target.value })} className="min-w-0 flex-1" />
                    <Select aria-label={`Field ${index + 1} type`} value={field.kind} onChange={(event) => updateField(index, { kind: event.target.value as FakeField["kind"] })} className="w-full min-[700px]:w-40">
                      {fieldKinds.map((item) => <option key={item} value={item}>{fieldLabels[item]}</option>)}
                    </Select>
                    <ActionButton variant="outline" size="sm" onClick={() => setFields(fields.filter((_, item) => item !== index))}>Remove</ActionButton>
                  </li>
                ))}
              </ul>
              <ActionButton variant="outline" size="sm" className="w-fit" onClick={() => setFields([...fields, { name: `field_${fields.length + 1}`, kind: "word" }])}>Add field</ActionButton>
            </>
          )}
        </Pane>
        <Pane label="Sample" padded={false} scroll={false}>
          <div aria-live="polite" className="flex min-h-[280px] flex-col gap-3 p-3">
            {error ? (
              <>
                <Notice tone="bad" role="alert" title={error} />
                <EmptyState art={<Dices size={22} />} title="No sample" hint="Fix the field names, then try again." />
              </>
            ) : (
              <CodeOutput code={output} filename={filename} label={tab === "lorem" ? "Text" : format.toUpperCase()} fill className="min-h-0 flex-1" />
            )}
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip note={error || (tab === "lorem" ? kind : `${format.toUpperCase()} · seed ${seed || "0"}`)} tone={error ? "warn" : "pass"} />
    </ToolCard>
  );

  function updateField(index: number, patch: Partial<FakeField>) {
    setFields(fields.map((field, item) => (item === index ? { ...field, ...patch } : field)));
  }
}

function numberOr(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
