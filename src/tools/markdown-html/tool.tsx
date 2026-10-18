"use client";

import { useMemo, useState } from "react";
import { Copy, FileCode } from "lucide-react";
import { toast } from "sonner";
import { OptionRow, TextArea } from "@/components/kit/controls";
import { CodeOutput } from "@/components/kit/code-output";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Segmented } from "@/components/kit/segmented";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { cleanHtml, htmlToMarkdown, markdownToHtml, sampleMarkdown, type ConvertTarget } from "@/tools/markdown-html/lib/convert";

export default function MarkdownHtmlTool() {
  const [text, setText] = useState(sampleMarkdown);
  const [to, setTo] = useState<ConvertTarget>("html");
  const [sanitize, setSanitize] = useState(true);

  const output = useMemo(
    () => (to === "html" ? markdownToHtml(text, sanitize) : htmlToMarkdown(text, sanitize)),
    [sanitize, text, to],
  );
  const preview = useMemo(() => (to === "html" ? cleanHtml(to === "html" && !sanitize ? markdownToHtml(text, false) : output) : ""), [output, sanitize, text, to]);

  function copy() {
    void navigator.clipboard.writeText(output).then(() => toast.success("Converted text copied"));
  }

  useWorkbenchKeys({
    onCopy: copy,
    onEscape: () => {
      setText(sampleMarkdown);
      setTo("html");
      setSanitize(true);
    },
  });

  return (
    <ToolShell
      runsLocally
      layout="split"
      tabs={<ToolTabs label="Direction" value={to} onChange={setTo} options={[{ value: "html", label: "To HTML" }, { value: "markdown", label: "To Markdown" }]} />}
      actions={<InkButton icon={<Copy size={15} />} disabled={!output} onClick={copy}>Copy</InkButton>}
      status={
        <>
          <span className="dot" />
          <span>{output.length.toLocaleString("en-US")} characters · preview is sanitized</span>
          <span className="ml-auto hidden min-[700px]:inline">⌘⇧C copy · esc reset</span>
        </>
      }
      input={
        <Panel title={to === "html" ? "Markdown" : "HTML"}>
          <Segmented
            label="Direction"
            value={to}
            onChange={setTo}
            options={[{ value: "html", label: "Markdown to HTML" }, { value: "markdown", label: "HTML to Markdown" }]}
          />
          <OptionRow label="Sanitize output" hint="The preview is cleaned either way." checked={sanitize} onChange={setSanitize} />
          <FieldRow label="Source" htmlFor="markup-source">
            <TextArea id="markup-source" value={text} onChange={(event) => setText(event.target.value)} spellCheck={false} className="min-h-72 font-mono text-[13px]" />
          </FieldRow>
        </Panel>
      }
      output={
        <Panel title={to === "html" ? "HTML" : "Markdown"}>
          {output ? (
            <div className="flex flex-col gap-3">
              <CodeOutput code={output} filename={to === "html" ? "page.html" : "page.md"} label={to === "html" ? "HTML" : "Markdown"} />
              {to === "html" ? (
                <div className="prose-output rounded-lg border border-border bg-surface p-3 text-sm" dangerouslySetInnerHTML={{ __html: preview }} />
              ) : null}
            </div>
          ) : (
            <EmptyState art={<FileCode size={22} />} title="Nothing to convert" hint="Paste Markdown or HTML. The preview stays sanitized." />
          )}
        </Panel>
      }
    />
  );
}
