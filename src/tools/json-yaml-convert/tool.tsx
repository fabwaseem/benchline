"use client";

import { useMemo, useState } from "react";
import { ActionButton, TextArea } from "@/components/kit/controls";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { CodeOutput } from "@/components/kit/code-output";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Segmented } from "@/components/kit/segmented";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { convertData, dataFormats, exampleYaml, type DataFormat } from "@/tools/json-yaml-convert/lib/convert";

const filenames: Record<DataFormat, string> = {
  json: "converted.json",
  yaml: "converted.yaml",
  toml: "converted.toml",
  xml: "converted.xml",
};

export default function JsonYamlTool() {
  const [input, setInput] = useState(exampleYaml);
  const [from, setFrom] = useState<DataFormat | "auto">("auto");
  const [to, setTo] = useState<DataFormat>("json");
  const result = useMemo(() => convertData(input, from, to), [from, input, to]);

  useWorkbenchKeys({
    onCopy: () => {
      if (!result.output) return;
      void navigator.clipboard.writeText(result.output).then(() => toast.success("Converted text copied"));
    },
    onEscape: () => {
      setInput(exampleYaml);
      setFrom("auto");
      setTo("json");
    },
  });

  const where = result.line && result.column ? `Line ${result.line}, column ${result.column}` : "Could not convert";
  const status = result.ok
    ? `${(result.detected ?? from).toUpperCase()} → ${to.toUpperCase()} · ${result.output.length.toLocaleString("en-US")} characters`
    : result.error;

  return (
    <ToolCard>
      <ToolToolbar
        label="Target format"
        options={dataFormats.map((format) => ({ value: format, label: format.toUpperCase() }))}
        value={to}
        onChange={setTo}
        actions={
          <ActionButton className="btn btn-ink" disabled={!result.output} onClick={() => void navigator.clipboard.writeText(result.output).then(() => toast.success("Converted text copied"))}>Copy</ActionButton>
        }
      />
      <ToolPanes>
        <Pane label="Source">
          <Segmented
            label="Source format"
            value={from}
            onChange={setFrom}
            options={[{ value: "auto", label: "Auto" }, ...dataFormats.map((format) => ({ value: format, label: format.toUpperCase() }))]}
          />
          <FieldRow label="Document" htmlFor="convert-input" error={result.ok ? undefined : result.error} help={result.detected ? `Read as ${result.detected.toUpperCase()}.` : "Auto uses the first line."}>
            <TextArea id="convert-input" value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} aria-invalid={!result.ok} className="min-h-72 font-mono text-[13px]" />
          </FieldRow>
        </Pane>
        <Pane label={result.ok ? to.toUpperCase() : "Error"}>
          <div aria-live="polite" className="flex min-h-[240px] flex-col gap-3">
            {result.ok ? (
              <CodeOutput code={result.output} filename={filenames[to]} label={to.toUpperCase()} fill />
            ) : (
              <>
                <Notice tone="bad" role="alert" title={where} body={result.error} />
                <EmptyState art={<ArrowLeftRight size={22} />} title="No output" hint="The source has to parse before it can be written in the other format." />
              </>
            )}
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip note={status} tone={result.ok ? "pass" : "warn"} trailing="⌘⇧C copy · esc reset" />
    </ToolCard>
  );
}
