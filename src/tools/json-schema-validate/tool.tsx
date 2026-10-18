"use client";

import { useMemo, useState } from "react";
import { FileJson } from "lucide-react";
import { CodeOutput } from "@/components/kit/code-output";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Panel, ToolShell, ToolTabs } from "@/components/kit/tool-shell";
import { Textarea } from "@/components/ui/textarea";
import { exampleJson, exampleSchema, exportTypes, inspectJson } from "@/tools/json-schema-validate/lib/schema";

export default function JsonSchemaTool() {
  const [tab, setTab] = useState<"infer" | "validate">("infer");
  const [json, setJson] = useState(exampleJson);
  const [schemaText, setSchemaText] = useState(exampleSchema);
  const report = useMemo(() => inspectJson(json, tab === "validate" ? schemaText : ""), [json, schemaText, tab]);
  const exported = useMemo(() => exportTypes(json), [json]);

  return (
    <ToolShell
      runsLocally
      layout="split"
      tabs={<ToolTabs label="Mode" value={tab} onChange={setTab} options={[{ value: "infer", label: "Infer" }, { value: "validate", label: "Validate" }]} />}
      status={
        <>
          <span className={report.valid ? "dot" : "dot dot-warn"} />
          <span>{report.valid ? "Valid" : `${report.errors.length} error${report.errors.length === 1 ? "" : "s"}`}</span>
        </>
      }
      input={
        <Panel title="JSON">
          <FieldRow label="Document" htmlFor="schema-json">
            <Textarea id="schema-json" value={json} onChange={(event) => setJson(event.target.value)} spellCheck={false} className="min-h-64 font-mono text-[13px]" />
          </FieldRow>
          {tab === "validate" ? (
            <FieldRow label="Schema" htmlFor="schema-text">
              <Textarea id="schema-text" value={schemaText} onChange={(event) => setSchemaText(event.target.value)} spellCheck={false} className="min-h-48 font-mono text-[13px]" />
            </FieldRow>
          ) : null}
        </Panel>
      }
      output={
        <div aria-live="polite" className="min-h-[240px]">
          {!report.valid ? (
            <Panel title="Errors">
              <Notice tone="bad" role="alert" title={report.errors[0]?.path ?? "Invalid"} body={report.errors[0]?.message} />
              {report.errors.length > 1 ? (
                <ul className="text-sm text-muted-foreground">
                  {report.errors.slice(1).map((error) => <li key={`${error.path}-${error.message}`}>{error.path}: {error.message}</li>)}
                </ul>
              ) : null}
              <EmptyState art={<FileJson size={22} />} title="Nothing matched" hint="Fix the JSON, or relax the schema." />
              {exported.typescript ? <CodeOutput code={exported.typescript} filename="root.ts" label="TypeScript" /> : null}
              {exported.zod ? <CodeOutput code={exported.zod} filename="root.ts" label="Zod" /> : null}
            </Panel>
          ) : (
            <Panel title={tab === "infer" ? "Schema" : "Result"}>
              <CodeOutput code={report.schema} filename="schema.json" label="JSON Schema" />
              {exported.error ? <Notice tone="warn" title="Types were not generated" body={exported.error} /> : null}
              {exported.typescript ? <CodeOutput code={exported.typescript} filename="root.ts" label="TypeScript" /> : null}
              {exported.zod ? <CodeOutput code={exported.zod} filename="root.ts" label="Zod" /> : null}
            </Panel>
          )}
        </div>
      }
    />
  );
}
