"use client";

import { useState } from "react";
import { Download, FileType } from "lucide-react";
import { toast } from "sonner";
import { ActionButton } from "@/components/kit/controls";
import { CodeOutput } from "@/components/kit/code-output";
import { downloadText } from "@/components/kit/download-button";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { Notice } from "@/components/kit/notice";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
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

  function download() {
    if (!result) return;
    downloadText(`${name.replace(/\.pdf$/i, "") || "document"}.md`, result.markdown, "text/markdown");
  }

  useWorkbenchKeys({ onCopy: copy, onEnter: download });

  return (
    <ToolCard>
      <ToolToolbar
        actions={
          <>
            <ActionButton className="btn btn-ink" disabled={!result} onClick={copy}>Copy</ActionButton>
            <ActionButton variant="outline" disabled={!result} onClick={download}><Download />Download</ActionButton>
          </>
        }
      />
      <ToolPanes ratio="40/60">
        <Pane label="PDF">
          <Dropzone accept="application/pdf,.pdf" onFiles={(files) => void readFile(files)} label="Drop a PDF. It stays in this browser." invalid={Boolean(error)} />
          <Notice tone="neutral" title="Selectable text only." body="Scanned pages have no text layer. This tool does not OCR them." />
          {error ? <Notice tone="bad" role="alert" title="Could not read the PDF" body={error} /> : null}
        </Pane>
        <Pane label="Markdown" padded={result ? false : true} scroll={result ? false : true}>
          {result ? (
            <CodeOutput code={result.markdown} filename={`${name.replace(/\.pdf$/i, "") || "document"}.md`} label="Markdown" fill chrome={false} />
          ) : (
            <EmptyState art={<FileType size={22} />} title="No text yet" hint="Drop a PDF. The text layer is read in this browser." />
          )}
        </Pane>
      </ToolPanes>
      <StatusStrip
        note={error || (busy ? "Reading the text layer" : "The PDF stays in this browser")}
        tone={error ? "fail" : busy ? "info" : "pass"}
        trailing="⌘⇧C copy"
        items={[
          { level: "info", label: "Pages", detail: result ? String(result.pageCount) : "—" },
          { level: result && result.emptyPages > 0 ? "warn" : "info", label: "Empty", detail: result ? String(result.emptyPages) : "—" },
          { level: "info", label: "Tokens", detail: result ? result.tokens.toLocaleString("en-US") : "—" },
        ]}
      />
    </ToolCard>
  );
}
