"use client";

import { useMemo, useState } from "react";
import { FileJson } from "lucide-react";
import { CodeField, CodeOutput } from "@/components/kit/code-output";
import { EmptyState } from "@/components/kit/empty-state";
import { Notice } from "@/components/kit/notice";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar, Truncate } from "@/components/kit/shell";
import { exampleJson, exampleSchema, exportTypes, inspectJson } from "@/tools/json-schema-validate/lib/schema";

export default function JsonSchemaTool() {
  const [tab, setTab] = useState<"infer" | "validate">("infer");
  const [json, setJson] = useState(exampleJson);
  const [schemaText, setSchemaText] = useState(exampleSchema);
  const report = useMemo(() => inspectJson(json, tab === "validate" ? schemaText : ""), [json, schemaText, tab]);
  const exported = useMemo(() => exportTypes(json), [json]);
  const note = report.valid ? "Valid" : `${report.errors.length} error${report.errors.length === 1 ? "" : "s"}`;

  return (
    <ToolCard>
      <ToolToolbar
        label="Mode"
        options={[{ value: "infer", label: "Infer" }, { value: "validate", label: "Validate" }]}
        value={tab}
        onChange={setTab}
      />
      <ToolPanes>
        <Pane label="JSON" scroll={false} bodyClassName="flex min-h-[320px] flex-col gap-3 p-3">
          <CodeField id="schema-json" label="JSON document" value={json} invalid={!report.valid} onChange={(event) => setJson(event.target.value)} className="min-h-0 flex-1" />
          {tab === "validate" ? (
            <CodeField id="schema-text" label="JSON Schema" value={schemaText} onChange={(event) => setSchemaText(event.target.value)} className="max-h-64 min-h-40" />
          ) : null}
        </Pane>
        <Pane label={report.valid ? (tab === "infer" ? "Schema" : "Result") : "Errors"}>
          <div aria-live="polite" className="flex flex-col gap-3">
            {!report.valid ? (
              <>
                <Notice tone="bad" role="alert" title={report.errors[0]?.path ?? "Invalid"} body={report.errors[0]?.message} />
                {report.errors.length > 1 ? (
                  <ul className="text-sm text-muted-foreground">
                    {report.errors.slice(1).map((error) => (
                      <li key={`${error.path}-${error.message}`}>
                        <Truncate value={`${error.path}: ${error.message}`} />
                      </li>
                    ))}
                  </ul>
                ) : null}
                <EmptyState art={<FileJson size={22} />} title="Nothing matched" hint="Fix the JSON, or relax the schema." />
              </>
            ) : (
              <CodeOutput code={report.schema} filename="schema.json" label="JSON Schema" />
            )}
            {exported.error ? <Notice tone="warn" title="Types were not generated" body={exported.error} /> : null}
            {exported.typescript ? <CodeOutput code={exported.typescript} filename="root.ts" label="TypeScript" /> : null}
            {exported.zod ? <CodeOutput code={exported.zod} filename="root.ts" label="Zod" /> : null}
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip note={note} tone={report.valid ? "pass" : "fail"} />
    </ToolCard>
  );
}
