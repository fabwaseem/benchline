"use client";

import { useMemo, useState } from "react";
import { Binary, Copy } from "lucide-react";
import { toast } from "sonner";
import { CodeOutput } from "@/components/kit/code-output";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Segmented } from "@/components/kit/segmented";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { decodeBase64, encodeBytes, encodeText, exampleText, type DecodeResult } from "@/tools/base64-codec/lib/codec";

type Source = "text" | "file";
type Action = "encode" | "decode";

export default function Base64Tool() {
  const [source, setSource] = useState<Source>("text");
  const [action, setAction] = useState<Action>("encode");
  const [text, setText] = useState(exampleText);
  const [payload, setPayload] = useState("");
  const [urlSafe, setUrlSafe] = useState(false);
  const [dataUri, setDataUri] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileMime, setFileMime] = useState("application/octet-stream");
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const encodedText = useMemo(
    () => encodeText(text, { urlSafe, dataUri, mime: "text/plain;charset=utf-8" }),
    [dataUri, text, urlSafe],
  );
  const encodedFile = useMemo(
    () => (bytes ? encodeBytes(bytes, { urlSafe, dataUri, mime: fileMime }) : ""),
    [bytes, dataUri, fileMime, urlSafe],
  );
  const decoded = useMemo(() => (action === "decode" && payload.trim() !== "" ? decodeBase64(payload) : null), [action, payload]);
  const output = source === "file" && action === "encode" ? encodedFile : action === "encode" ? encodedText : decoded && decoded.ok ? (decoded.text ?? "") : "";

  useWorkbenchKeys({
    onCopy: () => {
      const value = copyValue(source, action, encodedText, encodedFile, decoded);
      if (!value) return;
      void navigator.clipboard.writeText(value).then(() => toast.success("Copied"));
    },
    onEscape: () => {
      setText(exampleText);
      setPayload("");
      setUrlSafe(false);
      setDataUri(false);
      setBytes(null);
      setFileName("");
      setAction("encode");
      setSource("text");
    },
  });

  async function onFile(file: File) {
    const next = new Uint8Array(await file.arrayBuffer());
    setBytes(next);
    setFileName(file.name);
    setFileMime(file.type || "application/octet-stream");
    setAction("encode");
  }

  const copyTarget = copyValue(source, action, encodedText, encodedFile, decoded);
  const status = statusOf(source, action, fileName, bytes, encodedFile, decoded, urlSafe, dataUri);

  return (
    <ToolShell
      runsLocally
      layout="split+inspector"
      flow="band"
      columns="min-[1280px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_280px]"
      tabs={<ToolTabs label="Source" value={source} onChange={setSource} options={[{ value: "text", label: "Text" }, { value: "file", label: "File" }]} />}
      actions={<InkButton icon={<Copy size={15} />} disabled={!copyTarget} onClick={() => void navigator.clipboard.writeText(copyTarget).then(() => toast.success("Copied"))}>Copy</InkButton>}
      status={
        <>
          <span className={decoded && !decoded.ok ? "dot dot-warn" : "dot"} />
          <span>{status}</span>
          <span className="ml-auto hidden min-[700px]:inline">⌘⇧C copy · esc reset</span>
        </>
      }
      input={
        <Panel title={source === "text" ? "Text" : "File"}>
          <Segmented label="Action" value={action} onChange={setAction} options={[{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }]} />
          {source === "file" && action === "encode" ? (
            <FieldRow label="File" help={fileName ? `${fileName} · ${(bytes?.byteLength ?? 0).toLocaleString("en-US")} bytes` : "The file is read in this browser."}>
              <Dropzone accept="*/*" label="Drop a file, or click to choose one" onFile={(file) => void onFile(file)} />
            </FieldRow>
          ) : (
            <FieldRow label={action === "encode" ? "Text" : "Base64 or data URI"} htmlFor="b64-input" error={decoded && !decoded.ok ? decoded.error : undefined}>
              <Textarea
                id="b64-input"
                value={action === "encode" ? text : payload}
                onChange={(event) => (action === "encode" ? setText(event.target.value) : setPayload(event.target.value))}
                spellCheck={false}
                aria-invalid={Boolean(decoded && !decoded.ok)}
                className="min-h-72 font-mono text-[13px]"
              />
            </FieldRow>
          )}
        </Panel>
      }
      output={
        <div aria-live="polite" className="min-h-[240px]">
          {source === "file" && action === "encode" && !bytes ? (
            <Panel>
              <EmptyState art={<Binary size={22} />} title="No file yet" hint="Choose a file to encode. It is not uploaded." />
            </Panel>
          ) : null}
          {action === "decode" && !decoded ? (
            <Panel>
              <EmptyState art={<Binary size={22} />} title="Nothing to decode" hint="Paste Base64 or a data URI. Whitespace is ignored." />
            </Panel>
          ) : null}
          {action === "decode" && decoded && !decoded.ok ? (
            <Panel>
              <Notice tone="bad" role="alert" title={decoded.error} />
            </Panel>
          ) : null}
          {action === "decode" && decoded && decoded.ok ? (
            <Panel title="Decoded">
              <Notice tone="ok" title={decoded.mime} body={decoded.text === null ? "The bytes are not UTF-8. Download the file to keep them." : `${decoded.text.length.toLocaleString("en-US")} characters of text.`} />
              {decoded.text !== null ? <CodeOutput code={decoded.text} filename={decoded.filename} label="Text" /> : null}
              <button type="button" className="btn btn-ink h-[30px] self-start" onClick={() => downloadBytes(decoded.filename, decoded.bytes, decoded.mime)}>Download {decoded.filename}</button>
            </Panel>
          ) : null}
          {action === "encode" && output ? (
            <Panel title={dataUri ? "Data URI" : "Base64"}>
              <CodeOutput code={output} filename="encoded.txt" label={dataUri ? "Data URI" : "Base64"} />
            </Panel>
          ) : null}
        </div>
      }
      inspector={
        <Panel title="Options">
          <Toggle label="URL-safe" checked={urlSafe} onChange={setUrlSafe} />
          <Toggle label="Data URI" checked={dataUri} onChange={setDataUri} />
          <p className="text-[12px] text-faint">URL-safe output uses - and _ and drops the padding. A data URI keeps the standard alphabet so a browser can read it.</p>
        </Panel>
      }
    />
  );
}

function copyValue(source: Source, action: Action, encodedText: string, encodedFile: string, decoded: DecodeResult | null): string {
  if (action === "encode") return source === "file" ? encodedFile : encodedText;
  if (decoded && decoded.ok) return decoded.text ?? "";
  return "";
}

function statusOf(source: Source, action: Action, fileName: string, bytes: Uint8Array | null, encodedFile: string, decoded: DecodeResult | null, urlSafe: boolean, dataUri: boolean): string {
  const flags = `${urlSafe ? "URL-safe" : "Standard"}${dataUri ? " · data URI" : ""}`;
  if (action === "decode") {
    if (decoded && !decoded.ok) return decoded.error;
    if (decoded && decoded.ok) return `${decoded.mime} · ${decoded.bytes.byteLength.toLocaleString("en-US")} bytes`;
  }
  if (source === "file") {
    if (!bytes) return "Choose a file to encode";
    return `${fileName} · ${encodedFile.length.toLocaleString("en-US")} characters · ${flags}`;
  }
  return flags;
}

function downloadBytes(filename: string, bytes: Uint8Array, mime: string) {
  const copy = new Uint8Array(bytes);
  const blob = new Blob([copy.buffer], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  toast.success("Downloaded");
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
      {label}
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
