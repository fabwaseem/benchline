"use client";

import { useMemo, useState } from "react";
import { ActionButton, OptionRow, TextInput } from "@/components/kit/controls";
import { Braces } from "lucide-react";
import { toast } from "sonner";
import { CodeOutput } from "@/components/kit/code-output";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Segmented } from "@/components/kit/segmented";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar, type StripLevel } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
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
    <ToolCard>
      <ToolToolbar
        label="Schema type"
        options={schemaTypes.map((item) => ({ value: item, label: item }))}
        value={type}
        onChange={pick}
        actions={
          <>
            <ActionButton type="button" variant="outline" onClick={() => setValues(exampleValues(type))}>Load example</ActionButton>
            <ActionButton type="button" className="btn btn-ink" onClick={() => void navigator.clipboard.writeText(scriptTag(data)).then(() => toast.success("Script copied"))}>Copy script</ActionButton>
          </>
        }
      />
      <ToolPanes>
        <Pane label="Fields">
          <OptionRow label={<>Combine into @graph ({graph.length} saved)</>} checked={combine} onChange={setCombine} />
          <Fields type={type} values={values} checks={checks} onChange={setValues} />
          <ActionButton type="button" variant="outline" onClick={addToGraph}>Add to graph</ActionButton>
        </Pane>
        <Pane label="Output" scroll={false} bodyClassName="flex min-h-[320px] flex-col gap-3 p-3">
          {filled ? (
            <>
              <Segmented label="Output" value={tab} onChange={setTab} options={[{ value: "script", label: "Script" }, { value: "json", label: "JSON" }, { value: "next", label: "Next.js" }]} />
              <CodeOutput code={code} filename={tab === "json" ? "schema.json" : "schema.html"} label="JSON-LD" fill className="min-h-0 flex-1" />
            </>
          ) : (
            <EmptyState art={<Braces size={22} />} title="The script shows up here" hint="Fill the required fields. The checklist names what is still missing." />
          )}
        </Pane>
      </ToolPanes>
      <StatusStrip
        note={status}
        tone={fails ? "fail" : warns ? "warn" : "pass"}
        items={checks.map((check) => ({ level: stripLevel(check.level), label: check.label, detail: check.detail }))}
        trailing="⌘⇧C copy script · ⌘↵ add to graph"
      >
        <a className="text-[13px] whitespace-nowrap underline-offset-2 hover:underline" href="https://search.google.com/test/rich-results" target="_blank" rel="noreferrer">Rich Results Test</a>
        {warns > 0 && fails === 0 ? <Notice tone="warn" title={checks.find((check) => check.level === "warn")?.detail || "Review the warnings."} /> : null}
      </StatusStrip>
    </ToolCard>
  );
}

function stripLevel(level: string): StripLevel {
  if (level === "pass" || level === "warn" || level === "fail" || level === "info") return level;
  return "info";
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
            <TextInput id={`schema-${key}`} value={typeof values[key] === "string" ? values[key] : ""} aria-invalid={invalid || undefined} onChange={(event) => onChange({ ...values, [key]: event.target.value })} className="max-[699px]:h-11" />
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
            <TextInput key={field} aria-label={`${label} ${field} ${index + 1}`} value={item[field as "q"] ?? ""} className="max-[699px]:h-11" onChange={(event) => {
              const next = items.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: event.target.value } : row);
              onChange(next);
            }} />
          ))}
          <div className="flex gap-2">
            <ActionButton type="button" variant="ghost" size="sm" disabled={index === 0} onClick={() => onChange(move(items, index, -1))}>Up</ActionButton>
            <ActionButton type="button" variant="ghost" size="sm" disabled={index === items.length - 1} onClick={() => onChange(move(items, index, 1))}>Down</ActionButton>
            <ActionButton type="button" variant="ghost" size="sm" onClick={() => onChange(items.filter((_, rowIndex) => rowIndex !== index))}>Remove</ActionButton>
          </div>
        </div>
      ))}
      <ActionButton type="button" variant="outline" size="sm" className="max-[699px]:h-11" onClick={() => onChange([...items, {}])}>{addLabel}</ActionButton>
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
