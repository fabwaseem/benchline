"use client";

import { useEffect, useState } from "react";
import { OptionRow, TextInput, TextArea } from "@/components/kit/controls";
import { Hash } from "lucide-react";
import { CopyButton } from "@/components/kit/copy-button";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Segmented } from "@/components/kit/segmented";
import { Panel, ToolShell, ToolTabs } from "@/components/kit/tool-shell";
import { encodeText, hashAll, matchingAlgorithms, type HashRow } from "@/tools/hash-generator/lib/hash";

const MAX_FILE = 32 * 1024 * 1024;

export default function HashGeneratorTool() {
  const [tab, setTab] = useState<"text" | "file">("text");
  const [text, setText] = useState("abc");
  const [file, setFile] = useState<{ name: string; bytes: Uint8Array } | null>(null);
  const [fileError, setFileError] = useState("");
  const [secret, setSecret] = useState("");
  const [useHmac, setUseHmac] = useState(false);
  const [expected, setExpected] = useState("");
  const [format, setFormat] = useState<"hex" | "base64">("hex");
  const [rows, setRows] = useState<HashRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    const data = tab === "text" ? encodeText(text) : file?.bytes;
    if (!data || (useHmac && secret.length === 0)) {
      const clear = window.setTimeout(() => {
        if (!cancelled) setRows([]);
      }, 0);
      return () => {
        cancelled = true;
        window.clearTimeout(clear);
      };
    }
    void hashAll(data, useHmac ? encodeText(secret) : undefined).then((next) => {
      if (!cancelled) setRows(next);
    });
    return () => {
      cancelled = true;
    };
  }, [file, secret, tab, text, useHmac]);

  const matches = matchingAlgorithms(rows, expected);
  const waiting = useHmac && secret.length === 0;

  return (
    <ToolShell
      runsLocally
      layout="split"
      tabs={<ToolTabs label="Input" value={tab} onChange={setTab} options={[{ value: "text", label: "Text" }, { value: "file", label: "File" }]} />}
      status={
        <>
          <span className={fileError || waiting ? "dot dot-warn" : "dot"} />
          <span>{useHmac ? "HMAC" : "Digest"} · {format} · {tab === "file" ? file?.name ?? "no file" : `${new TextEncoder().encode(text).length} bytes`}</span>
        </>
      }
      input={
        <Panel title={tab === "text" ? "Text" : "File"}>
          {tab === "text" ? (
            <FieldRow label="Text" htmlFor="hash-text" help="Hashed as UTF-8.">
              <TextArea id="hash-text" value={text} onChange={(event) => setText(event.target.value)} className="min-h-40 font-mono" />
            </FieldRow>
          ) : (
            <>
              <Dropzone
                accept="*"
                label={file ? `${file.name} · ${formatBytes(file.bytes.length)}` : "Drop a file, or click to choose one"}
                invalid={Boolean(fileError)}
                onFile={(next) => {
                  if (next.size > MAX_FILE) {
                    setFile(null);
                    setFileError("Files larger than 32 MB stay out of this page.");
                    return;
                  }
                  setFileError("");
                  void next.arrayBuffer().then((buffer) => setFile({ name: next.name, bytes: new Uint8Array(buffer) }));
                }}
              />
              {fileError ? <Notice tone="bad" role="alert" title={fileError} /> : null}
            </>
          )}
          <OptionRow label="HMAC" checked={useHmac} onChange={setUseHmac} />
          {useHmac ? (
            <FieldRow label="HMAC key" htmlFor="hash-key" error={secret.length === 0 ? "Enter a key." : undefined}>
              <TextInput id="hash-key" value={secret} onChange={(event) => setSecret(event.target.value)} className="font-mono" aria-invalid={secret.length === 0} />
            </FieldRow>
          ) : null}
          <FieldRow label="Expected digest" htmlFor="hash-expected" help="Hex or base64. Spaces and colons are ignored.">
            <TextInput id="hash-expected" value={expected} onChange={(event) => setExpected(event.target.value)} className="font-mono" />
          </FieldRow>
        </Panel>
      }
      output={
        <Panel title="Digests">
          <Segmented label="Format" value={format} onChange={setFormat} options={[{ value: "hex", label: "Hex" }, { value: "base64", label: "Base64" }]} />
          <Notice tone="neutral" title="MD5 and SHA-1 are for checksums you were given." body="Use SHA-256 or SHA-512 for a new file hash. None of these are password hashes." />
          {rows.length === 0 ? (
            <EmptyState art={<Hash size={22} />} title={waiting ? "Add an HMAC key" : "Nothing to hash"} hint={tab === "file" ? "Choose a file." : "The empty string still has a digest."} />
          ) : (
            <ul>
              {rows.map((row) => {
                const value = format === "hex" ? row.hex : row.base64;
                const matched = matches.includes(row.algorithm);
                return (
                  <li key={row.algorithm} className="flex items-start gap-3 border-t border-border py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium">{row.algorithm}{matched ? " · matches" : ""}</p>
                      <p className="font-mono text-[12px] break-all">{value}</p>
                    </div>
                    <CopyButton value={value} label={`Copy ${row.algorithm}`} />
                  </li>
                );
              })}
            </ul>
          )}
          {expected.trim() && rows.length > 0 && matches.length === 0 ? <Notice tone="warn" title="That digest does not match any algorithm." /> : null}
        </Panel>
      }
    />
  );
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
