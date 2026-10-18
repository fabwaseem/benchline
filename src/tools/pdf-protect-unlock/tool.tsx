"use client";

import { useState } from "react";
import { Download, Lock } from "lucide-react";
import { ActionButton, OptionRow, TextInput } from "@/components/kit/controls";
import { downloadBytes } from "@/components/kit/download-button";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { formatBytes } from "@/lib/image-format";
import {
  defaultPermissions,
  protectActions,
  protectPdf,
  type PdfPermissions,
  type ProtectAction,
} from "@/tools/pdf-protect-unlock/lib/protect";

const permissionRows: { key: keyof PdfPermissions; label: string }[] = [
  { key: "printing", label: "Allow printing" },
  { key: "copying", label: "Allow copying text" },
  { key: "modifying", label: "Allow editing" },
  { key: "annotating", label: "Allow comments" },
  { key: "fillingForms", label: "Allow form filling" },
  { key: "contentAccessibility", label: "Allow accessibility access" },
  { key: "documentAssembly", label: "Allow page assembly" },
];

export default function PdfProtectTool() {
  const [file, setFile] = useState<Uint8Array | null>(null);
  const [name, setName] = useState("document.pdf");
  const [action, setAction] = useState<ProtectAction>("protect");
  const [password, setPassword] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [permissions, setPermissions] = useState<PdfPermissions>(defaultPermissions);
  const [result, setResult] = useState<{ bytes: Uint8Array; encrypted: boolean } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      setResult(await protectPdf(file, { action, password, ownerPassword, permissions }));
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Could not update that PDF.");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!result) return;
    const stem = name.replace(/\.pdf$/i, "") || "document";
    downloadBytes(`${stem}-${action === "protect" ? "protected" : "unlocked"}.pdf`, result.bytes, "application/pdf");
  }

  useWorkbenchKeys({ onEnter: () => { if (result) download(); else void run(); } });

  return (
    <ToolCard>
      <ToolToolbar
        label="Action"
        options={protectActions.map((item) => ({ value: item, label: item === "protect" ? "Protect" : "Unlock" }))}
        value={action}
        onChange={(next) => { setAction(next); setResult(null); }}
        actions={<ActionButton className="btn btn-ink" disabled={busy || !file} onClick={() => void run()}>{busy ? "Working" : action === "protect" ? "Protect" : "Unlock"}</ActionButton>}
      />
      <ToolPanes ratio="60/40">
        <Pane label="PDF">
          <Dropzone accept="application/pdf,.pdf" onFiles={(files) => {
            const picked = files[0];
            if (!picked) return;
            void picked.arrayBuffer().then((buffer) => {
              setFile(new Uint8Array(buffer));
              setName(picked.name || "document.pdf");
              setResult(null);
              setError("");
            });
          }} label={file ? name : "Drop a PDF. It stays in this browser."} invalid={Boolean(error)} />
          <FieldRow label="User password" htmlFor="pdf-password" help={action === "unlock" ? "The password that already opens this file." : "Required to open the protected PDF."}>
            <TextInput id="pdf-password" type="password" autoComplete="off" value={password} onChange={(event) => { setPassword(event.target.value); setResult(null); }} />
          </FieldRow>
          {action === "protect" ? (
            <>
              <FieldRow label="Owner password" htmlFor="pdf-owner" help="Blank uses the user password.">
                <TextInput id="pdf-owner" type="password" autoComplete="off" value={ownerPassword} onChange={(event) => { setOwnerPassword(event.target.value); setResult(null); }} />
              </FieldRow>
              {permissionRows.map((row) => (
                <OptionRow
                  key={row.key}
                  label={row.label}
                  checked={permissions[row.key]}
                  onChange={(checked) => {
                    setPermissions((current) => ({ ...current, [row.key]: checked }));
                    setResult(null);
                  }}
                />
              ))}
            </>
          ) : (
            <Notice tone="neutral" title="Known password only." body="Unlock writes a copy that opens without a password. It cannot guess a password." />
          )}
        </Pane>
        <Pane label="Result">
          {error ? <Notice tone="bad" role="alert" title="Could not update the PDF" body={error} /> : null}
          {result ? (
            <div className="flex flex-col gap-3">
              <Notice tone="ok" title={result.encrypted ? "Password set" : "Password removed"} body={result.encrypted ? `${formatBytes(result.bytes.byteLength)}. AES-256.` : `${formatBytes(result.bytes.byteLength)}. The copy opens without a password.`} />
              <ActionButton type="button" onClick={download}><Download />Download PDF</ActionButton>
            </div>
          ) : (
            <EmptyState art={<Lock size={22} />} title="No PDF yet" hint="Add a file and a password you know, then protect or unlock it." />
          )}
        </Pane>
      </ToolPanes>
      <StatusStrip
        note={error || (busy ? "Working in this browser" : "The password never leaves this tab")}
        tone={error ? "fail" : "pass"}
        trailing="⌘↵ run"
        items={action === "protect" ? permissionRows.map((row) => ({
          level: permissions[row.key] ? "pass" as const : "info" as const,
          label: row.label.replace("Allow ", ""),
        })) : []}
      />
    </ToolCard>
  );
}
