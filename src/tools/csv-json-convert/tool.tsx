"use client";

import { useMemo, useState } from "react";
import { ActionButton, OptionRow } from "@/components/kit/controls";
import { CodeEditor } from "@/components/kit/code-viewer";
import { Table2 } from "lucide-react";
import { toast } from "sonner";
import { CodeOutput } from "@/components/kit/code-output";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Segmented } from "@/components/kit/segmented";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { csvToJson, delimiterName, exampleCsv, exampleJsonRows, jsonToCsv, type DelimiterChoice } from "@/tools/csv-json-convert/lib/convert";

type Direction = "csv-json" | "json-csv";

export default function CsvJsonTool() {
  const [direction, setDirection] = useState<Direction>("csv-json");
  const [csv, setCsv] = useState(exampleCsv);
  const [json, setJson] = useState(exampleJsonRows);
  const [delimiter, setDelimiter] = useState<DelimiterChoice>("auto");
  const [header, setHeader] = useState(true);
  const [inferTypes, setInferTypes] = useState(true);
  const [flatten, setFlatten] = useState(false);
  const toJson = direction === "csv-json";
  const input = toJson ? csv : json;
  const result = useMemo(
    () => (toJson ? csvToJson(csv, { delimiter, header, inferTypes }) : jsonToCsv(json, { delimiter, header, flatten })),
    [csv, delimiter, flatten, header, inferTypes, json, toJson],
  );

  useWorkbenchKeys({
    onCopy: () => {
      if (!result.output) return;
      void navigator.clipboard.writeText(result.output).then(() => toast.success("Converted text copied"));
    },
    onEscape: () => {
      setCsv(exampleCsv);
      setJson(exampleJsonRows);
      setDelimiter("auto");
      setHeader(true);
      setInferTypes(true);
      setFlatten(false);
    },
  });

  const status = result.ok
    ? `${result.rows.toLocaleString("en-US")} rows · ${result.columns.toLocaleString("en-US")} columns · ${delimiterName(result.delimiter)}`
    : result.error;

  return (
    <ToolCard>
      <ToolToolbar
        label="Direction"
        options={[{ value: "csv-json", label: "CSV to JSON" }, { value: "json-csv", label: "JSON to CSV" }]}
        value={direction}
        onChange={setDirection}
        actions={<ActionButton className="btn btn-ink" disabled={!result.output} onClick={() => void navigator.clipboard.writeText(result.output).then(() => toast.success("Converted text copied"))}>Copy</ActionButton>}
      />
      <ToolPanes>
        <Pane label={toJson ? "CSV" : "JSON"}>
          <FieldRow label={toJson ? "Table" : "Rows"} htmlFor="csv-input" error={result.ok ? undefined : result.error}>
            <CodeEditor
              id="csv-input"
              label={toJson ? "Table" : "Rows"}
              language={toJson ? "csv" : "json"}
              filename={toJson ? "table.csv" : "rows.json"}
              value={input}
              onChange={(event) => (toJson ? setCsv(event.target.value) : setJson(event.target.value))}
              aria-invalid={!result.ok}
            />
          </FieldRow>
          <Segmented
            label="Delimiter"
            value={delimiter}
            onChange={setDelimiter}
            options={[
              { value: "auto", label: "Auto" },
              { value: ",", label: "Comma" },
              { value: "\t", label: "Tab" },
              { value: ";", label: "Semicolon" },
              { value: "|", label: "Pipe" },
            ]}
          />
          <OptionRow label="Header row" checked={header} onChange={setHeader} />
          {toJson ? <OptionRow label="Infer types" checked={inferTypes} onChange={setInferTypes} /> : <OptionRow label="Flatten nested values" checked={flatten} onChange={setFlatten} />}
        </Pane>
        <Pane label={result.ok ? (toJson ? "JSON" : "CSV") : "Error"}>
          <div aria-live="polite" className="flex min-h-[240px] flex-col gap-3">
            {result.ok ? (
              <>
                {result.warning ? <Notice tone="warn" title="The table has a ragged row" body={result.warning} /> : null}
                <CodeOutput code={result.output} filename={toJson ? "converted.json" : "converted.csv"} label={toJson ? "JSON" : "CSV"} fill />
              </>
            ) : (
              <>
                <Notice tone="bad" role="alert" title={result.error} />
                <EmptyState art={<Table2 size={22} />} title="No table" hint={toJson ? "Check quotes and the delimiter." : "Use an array of objects, an array of arrays, or one object."} />
              </>
            )}
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip note={status} tone={result.ok ? "pass" : "warn"} trailing="⌘⇧C copy · esc reset">
        <div className="grid w-full gap-2 min-[700px]:w-auto min-[700px]:grid-cols-2">
          <ResultStat variant="well" label="Rows" value={String(result.rows)} />
          <ResultStat variant="well" label="Columns" value={String(result.columns)} />
        </div>
      </StatusStrip>
    </ToolCard>
  );
}

