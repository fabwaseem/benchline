"use client";

import { useMemo, useState } from "react";
import { Braces, Copy } from "lucide-react";
import { toast } from "sonner";
import { CodeField, CodeOutput } from "@/components/kit/code-output";
import { ActionButton, OptionRow, Select } from "@/components/kit/controls";
import { FileButton } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { ErrorCallout } from "@/components/kit/notice";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { exampleJson, formatJson, type Indent, type JsonTreeNode } from "@/tools/json-formatter/lib/format";

export default function JsonFormatterTool() {
  const [input, setInput] = useState(exampleJson);
  const [indent, setIndent] = useState<Indent>("2");
  const [sortKeys, setSortKeys] = useState(false);
  const [minify, setMinify] = useState(false);
  const [tab, setTab] = useState<"format" | "tree">("format");
  const result = useMemo(() => formatJson(input, { indent, sortKeys, minify }), [indent, input, minify, sortKeys]);
  const issue = result.errors[0];
  const lines = result.output ? result.output.split("\n").length : 0;
  const bytes = new TextEncoder().encode(result.output).length;

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
    ? `Valid JSON · ${lines.toLocaleString("en-US")} lines · ${bytes.toLocaleString("en-US")} bytes`
    : `Invalid · line ${issue?.line ?? 1}, column ${issue?.column ?? 1}`;

  return (
    <ToolShell
      runsLocally
      layout="split+inspector"
      flow="band"
      columns="min-[1280px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_280px]"
      tabs={<ToolTabs label="View" value={tab} onChange={setTab} options={[{ value: "format", label: "Format" }, { value: "tree", label: "Tree" }]} />}
      actions={
        <>
          <ActionButton variant={minify ? "outline" : "default"} onClick={() => setMinify(false)}>Format</ActionButton>
          <ActionButton variant={minify ? "default" : "outline"} onClick={() => setMinify(true)}>Minify</ActionButton>
          <Select aria-label="Indent" value={indent} disabled={minify} onChange={(event) => setIndent(event.target.value as Indent)} className="w-[7.5rem]">
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tab</option>
          </Select>
          <FileButton
            accept="application/json,.json,text/plain"
            label="Upload"
            onFile={(file) => {
              void file.text().then((text) => {
                setInput(text);
                setMinify(false);
              });
            }}
          />
          <ActionButton variant="outline" onClick={() => { setInput(exampleJson); setMinify(false); }}>Sample</ActionButton>
          <ActionButton variant="ghost" onClick={() => setInput("")}>Clear</ActionButton>
          <InkButton icon={<Copy size={15} />} disabled={!result.output} onClick={() => void navigator.clipboard.writeText(result.output).then(() => toast.success("JSON copied"))}>Copy JSON</InkButton>
        </>
      }
      status={
        <>
          <span className={result.valid ? "dot" : "dot dot-warn"} />
          <span>{status}</span>
          <span className="ml-auto hidden min-[700px]:inline">⌘⇧C copy · esc reset</span>
        </>
      }
      input={
        <Panel title="JSON">
          <CodeField id="json-input" label="JSON document" value={input} invalid={!result.valid} onChange={(event) => setInput(event.target.value)} />
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
              <ErrorCallout title={issue ? `Line ${issue.line}, column ${issue.column}` : "Invalid JSON"} body={issue?.message} />
              {issue?.excerpt ? <pre className="overflow-auto rounded-lg border border-border bg-well p-3 font-mono text-[12.5px] whitespace-pre-wrap">{issue.excerpt}</pre> : null}
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
          <OptionRow label="Sort keys" checked={sortKeys} onChange={setSortKeys} hint={minify ? "Keys are sorted before whitespace is dropped." : "Sort object keys at every level."} />
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
