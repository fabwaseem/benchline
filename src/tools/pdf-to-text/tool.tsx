"use client";

import { useState } from "react";
import { Copy, Download, FileType } from "lucide-react";
import { toast } from "sonner";
import { ActionButton } from "@/components/kit/controls";
import { downloadText } from "@/components/kit/download-button";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { CodeOutput } from "@/components/kit/code-output";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { openBrowserPdf } from "@/lib/pdf-browser";
import { pdfFailure } from "@/lib/pdf-error";
import { assemblePdfText, pageFromItems, type PdfText } from "@/tools/pdf-to-text/lib/text";

export default function PdfToTextTool() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [result, setResult] = useState<PdfText | null>(null);

  async function readFile(files: File[]) {
    const file = files[0];
    if (!file) return;
    setBusy(true);
    setError("");
    setName(file.name || "document.pdf");
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const pdf = await openBrowserPdf(bytes);
      try {
        const pages = [];
        for (let page = 1; page <= pdf.numPages; page += 1) {
          const sheet = await pdf.getPage(page);
          const content = await sheet.getTextContent();
          pages.push({ page, ...pageFromItems(content.items) });
        }
        setResult(assemblePdfText(pages));
      } finally {
        await pdf.destroy();
      }
    } catch (caught) {
      setResult(null);
      setError(pdfFailure(caught));
    } finally {
      setBusy(false);
    }
  }

  function copy() {
    if (!result) return;
    void navigator.clipboard.writeText(result.markdown).then(() => toast.success("Markdown copied"));
  }

  useWorkbenchKeys({
    onCopy: copy,
    onEnter: () => {
      if (result) downloadText(`${name.replace(/\.pdf$/i, "") || "document"}.md`, result.markdown, "text/markdown");
    },
  });

  return (
    <ToolShell
      runsLocally
      busy={busy}
      layout="split"
      tabs={<ToolTabs label="Output" value="markdown" onChange={() => undefined} options={[{ value: "markdown", label: "Text" }]} />}
      actions={<InkButton icon={<Copy size={15} />} disabled={!result} onClick={copy}>Copy</InkButton>}
      status={
        <>
          <span className={error ? "dot dot-warn" : "dot"} />
          <span>{error || (busy ? "Reading the text layer" : "The PDF stays in this browser")}</span>
          <span className="ml-auto hidden min-[700px]:inline">⌘⇧C copy</span>
        </>
      }
      input={
        <Panel title="PDF">
          <Dropzone accept="application/pdf,.pdf" onFiles={(files) => void readFile(files)} label="Drop a PDF. It stays in this browser." invalid={Boolean(error)} />
          <Notice tone="neutral" title="Selectable text only." body="Scanned pages have no text layer. This tool does not OCR them." />
        </Panel>
      }
      output={
        <Panel title="Markdown">
          {error ? <Notice tone="bad" role="alert" title="Could not read the PDF" body={error} /> : null}
          {result ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                <ResultStat label="Pages" value={String(result.pageCount)} />
                <ResultStat label="Empty" value={String(result.emptyPages)} />
                <ResultStat label="Tokens" value={result.tokens.toLocaleString("en-US")} />
              </div>
              <CodeOutput code={result.markdown} filename={`${name.replace(/\.pdf$/i, "") || "document"}.md`} label="Markdown" />
              <ActionButton type="button" onClick={() => downloadText(`${name.replace(/\.pdf$/i, "") || "document"}.md`, result.markdown, "text/markdown")}>
                <Download />Download markdown
              </ActionButton>
            </div>
          ) : (
            <EmptyState art={<FileType size={22} />} title="No text yet" hint="Drop a PDF. The text layer is read in this browser." />
          )}
        </Panel>
      }
    />
  );
}
