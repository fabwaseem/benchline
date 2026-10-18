"use client";

import { useMemo, useState } from "react";
import { Braces, Copy } from "lucide-react";
import { toast } from "sonner";
import { CodeOutput } from "@/components/kit/code-output";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Segmented } from "@/components/kit/segmented";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { exampleJson, formatJson, type Indent, type JsonTreeNode } from "@/tools/json-formatter/lib/format";

export default function JsonFormatterTool() {
  const [input, setInput] = useState(exampleJson);
  const [indent, setIndent] = useState<Indent>("2");
  const [sortKeys, setSortKeys] = useState(false);
  const [minify, setMinify] = useState(false);
  const [tab, setTab] = useState<"format" | "tree">("format");
  const result = useMemo(() => formatJson(input, { indent, sortKeys, minify }), [indent, input, minify, sortKeys]);
  const issue = result.errors[0];

  useWorkbenchKeys({
    onCopy: () => {
      if (!result.output) return;
      void navigator.clipboard.writeText(result.output).then(() => toast.success("JSON copied"));
    },
    onEscape: () => {
      setInput(exampleJson);
      setIndent("2");
      setSortKeys(false);
      setMinify(false);
    },
  });

  const status = result.valid
    ? `Valid JSON · ${result.output.length.toLocaleString("en-US")} characters`
    : `Invalid · line ${issue?.line ?? 1}, column ${issue?.column ?? 1}`;

  return (
    <ToolShell
      runsLocally
      layout="split+inspector"
      flow="band"
      columns="min-[1280px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_300px]"
      tabs={<ToolTabs label="View" value={tab} onChange={setTab} options={[{ value: "format", label: "Format" }, { value: "tree", label: "Tree" }]} />}
      actions={<InkButton icon={<Copy size={15} />} disabled={!result.output} onClick={() => void navigator.clipboard.writeText(result.output).then(() => toast.success("JSON copied"))}>Copy JSON</InkButton>}
      status={
        <>
          <span className={result.valid ? "dot" : "dot dot-warn"} />
          <span>{status}</span>
          <span className="ml-auto hidden min-[700px]:inline">⌘⇧C copy · esc reset</span>
        </>
      }
      input={
        <Panel title="JSON">
          <FieldRow label="Document" htmlFor="json-input" error={issue ? `${issue.message} at line ${issue.line}, column ${issue.column}` : undefined}>
            <Textarea id="json-input" value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} aria-invalid={!result.valid} className="min-h-72 font-mono text-[13px]" />
          </FieldRow>
        </Panel>
      }
      output={
        <div aria-live="polite" className="min-h-[240px]">
          {result.valid && tab === "format" ? (
            <Panel title={minify ? "Minified" : "Formatted"}>
              <CodeOutput code={result.output} filename={minify ? "minified.json" : "formatted.json"} label="JSON" />
            </Panel>
          ) : null}
          {result.valid && tab === "tree" && result.tree ? (
            <Panel title="Tree">
              <Tree node={result.tree} depth={0} />
            </Panel>
          ) : null}
          {!result.valid ? (
            <Panel title="Error">
              <Notice tone="bad" role="alert" title={issue ? `Line ${issue.line}, column ${issue.column}` : "Invalid JSON"} body={issue?.message} />
              {issue?.excerpt ? <pre className="overflow-auto rounded-lg border border-border bg-background p-3 font-mono text-[12.5px] whitespace-pre-wrap">{issue.excerpt}</pre> : null}
              {result.errors.length > 1 ? (
                <ul className="text-sm text-muted-foreground">
                  {result.errors.slice(1).map((error) => (
                    <li key={`${error.offset}-${error.message}`}>Line {error.line}, column {error.column}: {error.message}</li>
                  ))}
                </ul>
              ) : null}
              <EmptyState art={<Braces size={22} />} title="Nothing to format" hint="Fix the line named above. Comments and trailing commas are rejected." />
            </Panel>
          ) : null}
        </div>
      }
      inspector={
        <Panel title="Options">
          <Segmented label="Style" value={minify ? "minify" : "pretty"} onChange={(value) => setMinify(value === "minify")} options={[{ value: "pretty", label: "Pretty" }, { value: "minify", label: "Minify" }]} />
          {minify ? <p className="text-[12px] text-faint">Minify drops insignificant whitespace. Indent is not used.</p> : (
            <Segmented label="Indent" value={indent} onChange={setIndent} options={[{ value: "2", label: "2 spaces" }, { value: "4", label: "4 spaces" }, { value: "tab", label: "Tab" }]} />
          )}
          <Toggle label="Sort keys" checked={sortKeys} onChange={setSortKeys} />
        </Panel>
      }
    />
  );
}

function Tree({ node, depth }: { node: JsonTreeNode; depth: number }) {
  if (node.children.length === 0) {
    return (
      <p className="font-mono text-[12.5px] leading-6">
        <span className="text-muted-foreground">{node.key}</span>
        <span className="text-faint"> {node.type} </span>
        {node.preview}
      </p>
    );
  }
  return (
    <details open={depth < 2} className="font-mono text-[12.5px] leading-6">
      <summary className="cursor-pointer">
        <span className="text-muted-foreground">{node.key}</span>
        <span className="text-faint"> {node.preview}</span>
      </summary>
      <div className="ml-3 border-l border-border pl-3">
        {node.children.map((child, index) => (
          <Tree key={`${child.key}-${index}`} node={child} depth={depth + 1} />
        ))}
      </div>
    </details>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
      {label}
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
