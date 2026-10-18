"use client";

import { useMemo, useState } from "react";
import { Braces } from "lucide-react";
import { toast } from "sonner";
import { CodeField, CodeOutput } from "@/components/kit/code-output";
import { ActionButton, OptionRow, TextInput } from "@/components/kit/controls";
import { FileButton } from "@/components/kit/dropzone";
import { DownloadButton } from "@/components/kit/download-button";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { ErrorCallout, Notice } from "@/components/kit/notice";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import {
  convertJsonToTypes,
  exampleJson,
  TARGET_LABELS,
  TARGETS,
  type Target,
} from "@/tools/json-to-types/lib/convert";

const EXTENSIONS: Record<Target, string> = {
  typescript: "ts",
  zod: "ts",
  pydantic: "py",
  dataclass: "py",
  go: "go",
};

export default function JsonToTypesTool() {
  const [input, setInput] = useState(exampleJson);
  const [rootName, setRootName] = useState("Person");
  const [targets, setTargets] = useState<Target[]>(["typescript", "zod"]);
  const [tab, setTab] = useState<Target>("typescript");

  const result = useMemo(() => convertJsonToTypes(input, { rootName, targets }), [input, rootName, targets]);
  const error = "error" in result ? result.error : null;
  const outputs = "error" in result ? {} : result.outputs;
  const warnings = "error" in result ? [] : result.warnings;
  const activeTab = (targets.includes(tab) ? tab : targets[0] ?? "typescript") as Target;
  const code = outputs[activeTab] ?? "";

  const toggleTarget = (target: Target) => {
    setTargets((prev) => {
      if (prev.includes(target)) {
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== target);
      }
      return [...prev, target];
    });
  };

  useWorkbenchKeys({
    onCopy: () => {
      if (!code) return;
      void navigator.clipboard.writeText(code).then(() => toast.success(`${TARGET_LABELS[activeTab]} copied`));
    },
    onEscape: () => {
      setInput(exampleJson);
      setRootName("Person");
    },
  });

  const bytes = new TextEncoder().encode(input).length;
  const status = error
    ? `Invalid JSON — ${error}`
    : `${Object.keys(outputs).length} target${Object.keys(outputs).length === 1 ? "" : "s"} · ${bytes.toLocaleString("en-US")} bytes in`;

  return (
    <ToolCard>
      <ToolToolbar
        label="Output"
        options={targets.map((t) => ({ value: t, label: TARGET_LABELS[t] }))}
        value={activeTab}
        onChange={(value) => setTab(value as Target)}
        actions={
          <>
            <FileButton
              accept="application/json,.json,text/plain"
              label="Upload"
              onFile={(file) => {
                void file.text().then((text) => setInput(text));
              }}
            />
            <ActionButton variant="outline" onClick={() => setInput(exampleJson)}>Sample</ActionButton>
            <ActionButton variant="ghost" onClick={() => setInput("")}>Clear</ActionButton>
            <ActionButton
              className="btn btn-ink"
              disabled={!code}
              onClick={() => void navigator.clipboard.writeText(code).then(() => toast.success(`${TARGET_LABELS[activeTab]} copied`))}
            >
              Copy
            </ActionButton>
            <DownloadButton filename={`types.${EXTENSIONS[activeTab]}`} content={code} label="Download" disabled={!code} />
          </>
        }
      />
      <ToolPanes>
        <Pane label="JSON" scroll={false} bodyClassName="flex min-h-[340px] flex-col gap-3 p-3">
          <CodeField
            id="json-input"
            label="JSON document"
            value={input}
            invalid={Boolean(error)}
            onChange={(event) => setInput(event.target.value)}
            className="min-h-0 flex-1"
          />
          <FieldRow label="Root type name" htmlFor="root-name">
            <TextInput
              id="root-name"
              value={rootName}
              onChange={(event) => setRootName(event.target.value)}
              className="font-mono"
              placeholder="Root"
            />
          </FieldRow>
          <FieldRow label="Targets">
            <div className="flex flex-col gap-1">
              {TARGETS.map((target) => (
                <OptionRow key={target} label={TARGET_LABELS[target]} checked={targets.includes(target)} onChange={() => toggleTarget(target)} />
              ))}
            </div>
          </FieldRow>
        </Pane>
        <Pane label={error ? "Error" : TARGET_LABELS[activeTab]} scroll={false} bodyClassName="flex min-h-[340px] flex-col gap-3 p-3">
          {error ? (
            <>
              <ErrorCallout title="Invalid JSON" body={error} />
              <EmptyState art={<Braces size={22} />} title="Nothing to convert" hint="Fix the JSON on the left — or load the sample." />
            </>
          ) : code ? (
            <>
              {warnings.map((warning) => (
                <Notice key={warning} tone="warn" title="Heads up" body={warning} />
              ))}
              <CodeOutput code={code} filename={`types.${EXTENSIONS[activeTab]}`} label={TARGET_LABELS[activeTab]} fill className="min-h-0 flex-1" />
            </>
          ) : (
            <EmptyState art={<Braces size={22} />} title="Pick a target" hint="Toggle at least one output target on the left." />
          )}
        </Pane>
      </ToolPanes>
      <StatusStrip note={status} tone={error ? "fail" : "pass"} trailing="⌘⇧C copy · esc reset" />
    </ToolCard>
  );
}
