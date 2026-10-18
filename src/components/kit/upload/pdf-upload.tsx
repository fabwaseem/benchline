"use client";

import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/kit/primitives/button";
import { Dropzone } from "@/components/kit/upload/dropzone";
import { formatBytes } from "@/components/kit/upload/files";
import { openBrowserPdf } from "@/lib/pdf-browser";

export function PdfUpload({
  file,
  onFile,
  maxSize,
}: {
  file: File | null;
  onFile: (file: File | null) => void;
  maxSize?: number;
}) {
  const [tracked, setTracked] = useState(file);
  const [preview, setPreview] = useState<string | null>(null);
  const [pages, setPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (file !== tracked) {
    setTracked(file);
    setPreview(null);
    setPages(null);
    setError(null);
  }
  useEffect(() => {
    if (!file) return;
    let revoked = false;
    let url: string | null = null;
    const bytes = file.arrayBuffer().then((buffer) => openBrowserPdf(new Uint8Array(buffer)));
    void bytes.then(async (pdf) => {
      setPages(pdf.numPages);
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.4 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext("2d");
      if (!context) return;
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      url = canvas.toDataURL("image/png");
      if (!revoked) setPreview(url);
      await pdf.destroy();
    }).catch(() => {
      if (!revoked) setError("Could not read that PDF.");
    });
    return () => {
      revoked = true;
    };
  }, [file]);
  if (!file) {
    return <Dropzone accept="application/pdf,.pdf" maxSize={maxSize} label="Drop a PDF or browse" hint="First page is previewed in the browser" onFile={(next) => onFile(next)} />;
  }
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-surface p-2">
      <div className="grid h-20 w-16 place-items-center overflow-hidden rounded-sm border border-border bg-well">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <FileText className="size-5 text-faint" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">{file.name}</p>
        <p className="font-mono text-[12px] text-muted-foreground">{pages ? `${pages} pages` : "Reading"} · {formatBytes(file.size)}</p>
        {error ? <p className="text-xs text-status-bad">{error}</p> : null}
        <Button className="mt-2" variant="ghost" size="sm" onClick={() => onFile(null)}>Remove</Button>
      </div>
    </div>
  );
}
