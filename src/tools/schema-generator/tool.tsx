"use client";

import { useMemo, useState } from "react";
import { CheckList } from "@/components/kit/check-list";
import { CodeOutput } from "@/components/kit/code-output";
import { FieldRow } from "@/components/kit/field-row";
import { Segmented } from "@/components/kit/segmented";
import { ToolShell } from "@/components/kit/tool-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { buildSchema, exampleValues, graphOf, nextSnippet, schemaTypes, scriptTag, validateSchema, type SchemaType, type SchemaValues } from "@/tools/schema-generator/lib/schema";

export default function SchemaTool() {
  const [type, setType] = useState<SchemaType>("Article");
  const [values, setValues] = useState<SchemaValues>(exampleValues("Article"));
  const [graph, setGraph] = useState<Record<string, unknown>[]>([]);
  const [combine, setCombine] = useState(false);
  const [tab, setTab] = useState<"script" | "json" | "next">("script");
  const data = useMemo(() => {
    const current = buildSchema(type, values);
    return combine ? graphOf([...graph, current]) : current;
  }, [combine, graph, type, values]);
  const checks = useMemo(() => validateSchema(type, values), [type, values]);
  const json = JSON.stringify(data, null, 2);
  const code = tab === "script" ? scriptTag(data) : tab === "next" ? nextSnippet(data) : json;

  function pick(next: SchemaType) {
    setType(next);
    setValues(exampleValues(next));
  }

  return (
    <ToolShell
      runsLocally
      actions={
        <>
          <Button type="button" variant="outline" onClick={() => setValues(exampleValues(type))}>Load example</Button>
          <Button type="button" variant="outline" onClick={() => setGraph([...graph, buildSchema(type, values)])}>Add to graph</Button>
          <a className="text-xs text-primary underline-offset-2 hover:underline" href="https://search.google.com/test/rich-results" target="_blank" rel="noreferrer">Rich Results Test</a>
        </>
      }
    >
      <div className="grid lg:grid-cols-2 lg:divide-x lg:divide-border">
        <div className="flex flex-col gap-3 p-4">
          <FieldRow label="Type" htmlFor="schema-type">
            <div className="flex gap-1 overflow-x-auto">
              {schemaTypes.map((item) => (
                <button key={item} type="button" onClick={() => pick(item)} className={`shrink-0 rounded-md border px-2 py-1 text-xs ${item === type ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{item}</button>
              ))}
            </div>
          </FieldRow>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={combine} onCheckedChange={setCombine} />
            Combine into @graph ({graph.length} saved)
          </label>
          <Fields type={type} values={values} onChange={setValues} />
          <CheckList rows={checks} />
        </div>
        <div className="flex flex-col gap-3 border-t border-border p-4 lg:border-t-0">
          <Segmented label="Output" value={tab} onChange={setTab} options={[{ value: "script", label: "Script" }, { value: "json", label: "JSON" }, { value: "next", label: "Next.js" }]} />
          <CodeOutput code={code} filename={tab === "json" ? "schema.json" : "schema.html"} label="JSON-LD" />
        </div>
      </div>
    </ToolShell>
  );
}

function Fields({ type, values, onChange }: { type: SchemaType; values: SchemaValues; onChange: (values: SchemaValues) => void }) {
  const keys = Object.keys(exampleValues(type)).filter((key) => typeof exampleValues(type)[key] === "string");
  return (
    <div className="grid gap-3">
      {keys.map((key) => (
        <FieldRow key={key} label={key} htmlFor={`schema-${key}`}>
          <Input id={`schema-${key}`} value={typeof values[key] === "string" ? values[key] : ""} onChange={(event) => onChange({ ...values, [key]: event.target.value })} />
        </FieldRow>
      ))}
      {Array.isArray(values.faqs) ? <Repeater label="Questions" items={values.faqs} fields={["q", "a"]} onChange={(faqs) => onChange({ ...values, faqs })} /> : null}
      {Array.isArray(values.steps) ? <Repeater label="Steps" items={values.steps} fields={["name", "text"]} onChange={(steps) => onChange({ ...values, steps })} /> : null}
      {Array.isArray(values.items) ? <Repeater label="Crumbs" items={values.items} fields={["name", "url"]} onChange={(items) => onChange({ ...values, items })} /> : null}
    </div>
  );
}

function Repeater({ label, items, fields, onChange }: { label: string; items: { q?: string; a?: string; name?: string; text?: string; url?: string }[]; fields: string[]; onChange: (items: { q?: string; a?: string; name?: string; text?: string; url?: string }[]) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium">{label}</p>
      {items.map((item, index) => (
        <div key={`${label}-${index}`} className="grid gap-2">
          {fields.map((field) => (
            <Input key={field} aria-label={`${label} ${field} ${index + 1}`} value={item[field as "q"] ?? ""} onChange={(event) => {
              const next = items.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: event.target.value } : row);
              onChange(next);
            }} />
          ))}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, {}])}>Add</Button>
    </div>
  );
}
