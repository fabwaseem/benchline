"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ActionButton, OptionRow } from "@/components/kit/controls";
import { CodeEditor } from "@/components/kit/code-viewer";
import { CodeOutput } from "@/components/kit/code-output";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { FileCode } from "lucide-react";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { cleanHtml, htmlToMarkdown, markdownToHtml, sampleMarkdown, type ConvertTarget } from "@/tools/markdown-html/lib/convert";

export default function MarkdownHtmlTool() {
  const [text, setText] = useState(sampleMarkdown);
  const [to, setTo] = useState<ConvertTarget>("html");
  const [sanitize, setSanitize] = useState(true);

  const output = useMemo(
    () => (to === "html" ? markdownToHtml(text, sanitize) : htmlToMarkdown(text, sanitize)),
    [sanitize, text, to],
  );
  const preview = useMemo(() => (to === "html" ? cleanHtml(markdownToHtml(text, false)) : ""), [text, to]);

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
    <ToolCard>
      <ToolToolbar
        label="Direction"
        options={[{ value: "html", label: "To HTML" }, { value: "markdown", label: "To Markdown" }]}
        value={to}
        onChange={setTo}
        actions={<ActionButton className="btn btn-ink" disabled={!output} onClick={copy}>Copy</ActionButton>}
      />
      <ToolPanes>
        <Pane label={to === "html" ? "Markdown" : "HTML"}>
          <OptionRow label="Sanitize output" hint="The preview is cleaned either way." checked={sanitize} onChange={setSanitize} />
          <FieldRow label="Source" htmlFor="markup-source">
            <CodeEditor id="markup-source" label="Source" language={to === "html" ? "markdown" : "html"} value={text} onChange={(event) => setText(event.target.value)} />
          </FieldRow>
        </Pane>
        <Pane label={to === "html" ? "HTML" : "Markdown"}>
          {output ? (
            <div className="flex flex-col gap-3">
              <CodeOutput code={output} filename={to === "html" ? "page.html" : "page.md"} label={to === "html" ? "HTML" : "Markdown"} />
              {to === "html" ? (
                <div className="rounded-lg border border-border bg-surface p-3 text-sm leading-6" dangerouslySetInnerHTML={{ __html: preview }} />
              ) : null}
            </div>
          ) : (
            <EmptyState art={<FileCode size={22} />} title="Nothing to convert" hint="Paste Markdown or HTML. The preview stays sanitized." />
          )}
        </Pane>
      </ToolPanes>
      <StatusStrip
        note={`${output.length.toLocaleString("en-US")} characters`}
        tone="pass"
        trailing="⌘⇧C copy · esc reset"
        items={[
          { level: sanitize ? "pass" : "warn", label: "Sanitize", detail: sanitize ? "On" : "Off" },
          { level: "pass", label: "Preview", detail: "Sanitized" },
        ]}
      />
    </ToolCard>
  );
}
