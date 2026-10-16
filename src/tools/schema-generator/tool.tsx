"use client";

import { useMemo, useState } from "react";
import { Braces, Copy } from "lucide-react";
import { toast } from "sonner";
import { CheckRows } from "@/components/kit/check-row";
import { CodeOutput } from "@/components/kit/code-output";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Segmented } from "@/components/kit/segmented";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
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
    return combine && graph.length > 0 ? graphOf([...graph, current]) : current;
  }, [combine, graph, type, values]);
  const checks = useMemo(() => validateSchema(type, values), [type, values]);
  const json = JSON.stringify(data, null, 2);
  const code = tab === "script" ? scriptTag(data) : tab === "next" ? nextSnippet(data) : json;
  const bytes = new TextEncoder().encode(json).length;
  const fails = checks.filter((check) => check.level === "fail").length;
  const warns = checks.filter((check) => check.level === "warn").length;
  const filled = checks.some((check) => check.level === "pass");

  function pick(next: SchemaType) {
    setType(next);
    setValues(exampleValues(next));
  }

  function addToGraph() {
    setGraph([...graph, buildSchema(type, values)]);
    setCombine(true);
    toast.success("Added to graph");
  }

  useWorkbenchKeys({
    onCopy: () => {
      void navigator.clipboard.writeText(tab === "script" ? scriptTag(data) : code).then(() => toast.success("Script copied"));
    },
    onEnter: addToGraph,
  });

  const status = fails
    ? `${fails} required ${fails === 1 ? "field" : "fields"} missing`
    : warns
      ? `${type} · ${warns} ${warns === 1 ? "warning" : "warnings"}`
      : `${type} · valid JSON-LD · ${bytes.toLocaleString("en-US")} B`;

  return (
    <ToolShell
      runsLocally
      layout="split+inspector"
      flow="band"
      columns="min-[1280px]:grid-cols-[380px_minmax(0,1fr)_320px]"
      tabs={<ToolTabs label="Mode" value="build" onChange={() => {}} options={[{ value: "build", label: "Build" }]} />}
      actions={<InkButton icon={<Copy size={15} />} onClick={() => void navigator.clipboard.writeText(scriptTag(data)).then(() => toast.success("Script copied"))}>Copy script</InkButton>}
      status={
        <>
          <span className={fails ? "dot dot-warn" : "dot"} />
          <span>{status}</span>
          <span className="ml-auto hidden min-[700px]:inline">⌘⇧C copy script · ⌘↵ add to graph</span>
        </>
      }
      input={
        <Panel title="Fields">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Schema type">
            {schemaTypes.map((item) => (
              <button key={item} type="button" role="radio" aria-checked={item === type} data-on={item === type ? "true" : "false"} className="chip h-8 max-[699px]:h-11" onClick={() => pick(item)}>
                {item}
              </button>
            ))}
          </div>
          <label className="flex items-center justify-between gap-3 text-sm">
            Combine into @graph ({graph.length} saved)
            <Switch checked={combine} onCheckedChange={setCombine} />
          </label>
          <Fields type={type} values={values} checks={checks} onChange={setValues} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="max-[699px]:h-11" onClick={() => setValues(exampleValues(type))}>Load example</Button>
            <Button type="button" variant="outline" className="max-[699px]:h-11" onClick={addToGraph}>Add to graph</Button>
          </div>
        </Panel>
      }
      output={
        <Panel title="Output">
          {filled ? (
            <>
              <Segmented label="Output" value={tab} onChange={setTab} options={[{ value: "script", label: "Script" }, { value: "json", label: "JSON" }, { value: "next", label: "Next.js" }]} />
              <CodeOutput code={code} filename={tab === "json" ? "schema.json" : "schema.html"} label="JSON-LD" />
              <a className="text-[13px] underline-offset-2 hover:underline" href="https://search.google.com/test/rich-results" target="_blank" rel="noreferrer">Rich Results Test</a>
            </>
          ) : (
            <EmptyState art={<Braces size={22} />} title="The script shows up here" hint="Fill the required fields. The checklist names what is still missing." />
          )}
        </Panel>
      }
      inspector={
        <Panel title="Checklist">
          <div aria-live="polite">
            <CheckRows rows={checks} />
          </div>
          {warns > 0 && fails === 0 ? <Notice className="mx-4" tone="warn" title={checks.find((check) => check.level === "warn")?.detail || "Review the warnings."} /> : null}
        </Panel>
      }
    />
  );
}

function Fields({ type, values, checks, onChange }: { type: SchemaType; values: SchemaValues; checks: { level: string; label: string; detail: string }[]; onChange: (values: SchemaValues) => void }) {
  const keys = Object.keys(exampleValues(type)).filter((key) => typeof exampleValues(type)[key] === "string");
  return (
    <div className="grid gap-3">
      {keys.map((key) => {
        const check = checks.find((item) => item.label === key);
        const invalid = check?.level === "fail";
        const help = key === "datePublished" || key === "startDate"
          ? check?.detail
          : key === "image" && check?.level !== "pass"
            ? "Google recommends an image."
            : undefined;
        return (
          <FieldRow key={key} label={key} htmlFor={`schema-${key}`} help={help} error={invalid ? check?.detail : undefined}>
            <Input id={`schema-${key}`} value={typeof values[key] === "string" ? values[key] : ""} aria-invalid={invalid || undefined} onChange={(event) => onChange({ ...values, [key]: event.target.value })} className="max-[699px]:h-11" />
          </FieldRow>
        );
      })}
      {Array.isArray(values.faqs) ? <Repeater label="Questions" addLabel="Add question" items={values.faqs} fields={["q", "a"]} onChange={(faqs) => onChange({ ...values, faqs })} /> : null}
      {Array.isArray(values.steps) ? <Repeater label="Steps" addLabel="Add step" items={values.steps} fields={["name", "text"]} onChange={(steps) => onChange({ ...values, steps })} /> : null}
      {Array.isArray(values.items) ? <Repeater label="Crumbs" addLabel="Add crumb" items={values.items} fields={["name", "url"]} onChange={(items) => onChange({ ...values, items })} /> : null}
    </div>
  );
}

function Repeater({ label, addLabel, items, fields, onChange }: { label: string; addLabel: string; items: { q?: string; a?: string; name?: string; text?: string; url?: string }[]; fields: string[]; onChange: (items: { q?: string; a?: string; name?: string; text?: string; url?: string }[]) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium">{label}</p>
      {items.map((item, index) => (
        <div key={`${label}-${index}`} className="grid gap-2 rounded-lg border border-border p-2">
          {fields.map((field) => (
            <Input key={field} aria-label={`${label} ${field} ${index + 1}`} value={item[field as "q"] ?? ""} className="max-[699px]:h-11" onChange={(event) => {
              const next = items.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: event.target.value } : row);
              onChange(next);
            }} />
          ))}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" disabled={index === 0} onClick={() => onChange(move(items, index, -1))}>Up</Button>
            <Button type="button" variant="ghost" size="sm" disabled={index === items.length - 1} onClick={() => onChange(move(items, index, 1))}>Down</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(items.filter((_, rowIndex) => rowIndex !== index))}>Remove</Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="max-[699px]:h-11" onClick={() => onChange([...items, {}])}>{addLabel}</Button>
    </div>
  );
}

function move<T>(items: T[], index: number, direction: -1 | 1) {
  const next = index + direction;
  if (next < 0 || next >= items.length) return items;
  const copy = [...items];
  const [row] = copy.splice(index, 1);
  if (row === undefined) return items;
  copy.splice(next, 0, row);
  return copy;
}
