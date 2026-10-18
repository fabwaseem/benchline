"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, Copy } from "lucide-react";
import { toast } from "sonner";
import { CodeOutput } from "@/components/kit/code-output";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Segmented } from "@/components/kit/segmented";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { Textarea } from "@/components/ui/textarea";
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
    <ToolShell
      runsLocally
      layout="split"
      tabs={<ToolTabs label="Target format" value={to} onChange={setTo} options={dataFormats.map((format) => ({ value: format, label: format.toUpperCase() }))} />}
      actions={<InkButton icon={<Copy size={15} />} disabled={!result.output} onClick={() => void navigator.clipboard.writeText(result.output).then(() => toast.success("Converted text copied"))}>Copy</InkButton>}
      status={
        <>
          <span className={result.ok ? "dot" : "dot dot-warn"} />
          <span>{status}</span>
          <span className="ml-auto hidden min-[700px]:inline">⌘⇧C copy · esc reset</span>
        </>
      }
      input={
        <Panel title="Source">
          <Segmented
            label="Source format"
            value={from}
            onChange={setFrom}
            options={[{ value: "auto", label: "Auto" }, ...dataFormats.map((format) => ({ value: format, label: format.toUpperCase() }))]}
          />
          <FieldRow label="Document" htmlFor="convert-input" error={result.ok ? undefined : result.error} help={result.detected ? `Read as ${result.detected.toUpperCase()}.` : "Auto uses the first line."}>
            <Textarea id="convert-input" value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} aria-invalid={!result.ok} className="min-h-72 font-mono text-[13px]" />
          </FieldRow>
        </Panel>
      }
      output={
        <div aria-live="polite" className="min-h-[240px]">
          {result.ok ? (
            <Panel title={to.toUpperCase()}>
              <CodeOutput code={result.output} filename={filenames[to]} label={to.toUpperCase()} />
            </Panel>
          ) : (
            <Panel title="Error">
              <Notice tone="bad" role="alert" title={where} body={result.error} />
              <EmptyState art={<ArrowLeftRight size={22} />} title="No output" hint="The source has to parse before it can be written in the other format." />
            </Panel>
          )}
        </div>
      }
    />
  );
}
