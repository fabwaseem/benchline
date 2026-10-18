"use client";

import { useState } from "react";
import { ScanText } from "lucide-react";
import { toast } from "sonner";
import { ActionButton, Select } from "@/components/kit/controls";
import { CodeOutput } from "@/components/kit/code-output";
import { downloadText } from "@/components/kit/download-button";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ProgressMeter } from "@/components/kit/progress-meter";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { IMAGE_ACCEPT } from "@/lib/image-format";
import { ocrLanguages, type OcrLanguage } from "@/tools/ocr-image-to-text/lib/text";

const MAX_FILE = 20 * 1024 * 1024;

export default function OcrTool() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<OcrLanguage>("eng");
  const [text, setText] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ label: "Waiting", percent: 0 });
  const [error, setError] = useState("");

  async function read() {
    if (!file) return;
    if (file.size > MAX_FILE) {
      setError("Images larger than 20 MB stay out of this page.");
      return;
    }
    setBusy(true);
    setError("");
    setText("");
    setConfidence(null);
    setProgress({ label: "Loading the OCR engine", percent: 2 });
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker(language, 1, {
        logger: (message) => {
          const percent = Math.round((message.progress || 0) * 100);
          const label = message.status === "recognizing text" ? "Reading the image" : "Loading the OCR engine";
          setProgress({ label, percent: message.status === "recognizing text" ? 40 + percent * 0.6 : Math.max(5, percent * 0.4) });
        },
      });
      try {
        await worker.setParameters({ user_defined_dpi: "150" });
        const result = await worker.recognize(file);
        const { cleanOcrText, roundConfidence } = await import("@/tools/ocr-image-to-text/lib/text");
        setText(cleanOcrText(result.data.text));
        setConfidence(roundConfidence(result.data.confidence));
        setProgress({ label: "Done", percent: 100 });
      } finally {
        await worker.terminate();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not read that image.");
    } finally {
      setBusy(false);
    }
  }

  useWorkbenchKeys({
    onEnter: () => void read(),
    onCopy: () => { if (text) void navigator.clipboard.writeText(text).then(() => toast.success("Copied")); },
  });

  return (
    <ToolCard>
      <ToolToolbar
        actions={<ActionButton className="btn btn-ink" disabled={!file || busy} onClick={() => void read()}>{busy ? "Reading" : "Read text"}</ActionButton>}
      />
      <ToolPanes ratio="40/60">
        <Pane label="Image">
          <Notice tone="neutral" title="Nothing is uploaded." body="The first run downloads the language data. A progress line shows that download, then the recognition." />
          <Dropzone accept={IMAGE_ACCEPT} label={file ? file.name : "Drop an image, or click to choose one"} onFile={setFile} />
          <FieldRow label="Language" htmlFor="ocr-lang">
            <Select id="ocr-lang" value={language} onChange={(event) => setLanguage(event.target.value as OcrLanguage)}>
              {ocrLanguages.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </Select>
          </FieldRow>
          {busy || progress.percent > 0 ? <ProgressMeter label={progress.label} value={progress.percent} /> : null}
        </Pane>
        <Pane label="Text" scroll={false} bodyClassName="flex min-h-[320px] flex-col gap-3 p-3">
          {text ? (
            <>
              <CodeOutput code={text} filename="text.txt" label="Text" fill chrome={false} className="min-h-0 flex-1" />
              <ActionButton variant="outline" onClick={() => downloadText("text.txt", text)}>Download text</ActionButton>
            </>
          ) : (
            <EmptyState art={<ScanText size={22} />} title={error ? "No text" : "No text yet"} hint={error || "Drop a screenshot or a scan, then read it."} />
          )}
        </Pane>
      </ToolPanes>
      <StatusStrip
        note={error || (confidence === null ? "Waiting for an image" : `${confidence}% confidence`)}
        tone={error ? "warn" : confidence === null ? "info" : "pass"}
        trailing="Runs in this browser"
        items={confidence === null ? undefined : [{ level: confidence >= 70 ? "pass" : "warn", label: language, detail: `${confidence}%` }]}
      />
    </ToolCard>
  );
}
