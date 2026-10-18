"use client";

import { useMemo, useState } from "react";
import { TextArea, OptionRow } from "@/components/kit/controls";
import { Copy, Table2 } from "lucide-react";
import { toast } from "sonner";
import { CodeOutput } from "@/components/kit/code-output";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Segmented } from "@/components/kit/segmented";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
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
    <ToolShell
      runsLocally
      layout="split+inspector"
      flow="band"
      columns="min-[1280px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_280px]"
      tabs={<ToolTabs label="Direction" value={direction} onChange={setDirection} options={[{ value: "csv-json", label: "CSV to JSON" }, { value: "json-csv", label: "JSON to CSV" }]} />}
      actions={<InkButton icon={<Copy size={15} />} disabled={!result.output} onClick={() => void navigator.clipboard.writeText(result.output).then(() => toast.success("Converted text copied"))}>Copy</InkButton>}
      status={
        <>
          <span className={result.ok ? "dot" : "dot dot-warn"} />
          <span>{status}</span>
          <span className="ml-auto hidden min-[700px]:inline">⌘⇧C copy · esc reset</span>
        </>
      }
      input={
        <Panel title={toJson ? "CSV" : "JSON"}>
          <FieldRow label={toJson ? "Table" : "Rows"} htmlFor="csv-input" error={result.ok ? undefined : result.error}>
            <TextArea
              id="csv-input"
              value={input}
              onChange={(event) => (toJson ? setCsv(event.target.value) : setJson(event.target.value))}
              spellCheck={false}
              aria-invalid={!result.ok}
              className="min-h-72 font-mono text-[13px]"
            />
          </FieldRow>
        </Panel>
      }
      output={
        <div aria-live="polite" className="min-h-[240px]">
          {result.ok ? (
            <Panel title={toJson ? "JSON" : "CSV"}>
              {result.warning ? <Notice tone="warn" title="The table has a ragged row" body={result.warning} /> : null}
              <CodeOutput code={result.output} filename={toJson ? "converted.json" : "converted.csv"} label={toJson ? "JSON" : "CSV"} />
            </Panel>
          ) : (
            <Panel>
              <Notice tone="bad" role="alert" title={result.error} />
              <EmptyState art={<Table2 size={22} />} title="No table" hint={toJson ? "Check quotes and the delimiter." : "Use an array of objects, an array of arrays, or one object."} />
            </Panel>
          )}
        </div>
      }
      inspector={
        <Panel title="Options">
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
          <div className="grid grid-cols-2 gap-2">
            <ResultStat variant="well" label="Rows" value={String(result.rows)} />
            <ResultStat variant="well" label="Columns" value={String(result.columns)} />
          </div>
        </Panel>
      }
    />
  );
}

