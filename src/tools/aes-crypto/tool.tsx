"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { ActionButton, ChipButton, Slider, TextArea, TextInput } from "@/components/kit/controls";
import { CopyButton } from "@/components/kit/copy-button";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Segmented } from "@/components/kit/segmented";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import {
  AES_ITERATIONS_DEFAULT,
  AES_ITERATIONS_MAX,
  AES_ITERATIONS_MIN,
  decryptBundle,
  encryptText,
} from "@/tools/aes-crypto/lib/aes";

export default function AesCryptoTool() {
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [plaintext, setPlaintext] = useState("");
  const [bundle, setBundle] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [iterations, setIterations] = useState(AES_ITERATIONS_DEFAULT);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useWorkbenchKeys({
    onCopy: () => {
      if (!output) return;
      void navigator.clipboard.writeText(output);
    },
  });

  async function run() {
    setBusy(true);
    setError("");
    setOutput("");
    try {
      if (mode === "encrypt") {
        const result = await encryptText(plaintext, passphrase, iterations);
        if ("error" in result) setError(result.error);
        else setOutput(result.bundle);
      } else {
        const result = await decryptBundle(bundle, passphrase);
        if ("error" in result) setError(result.error);
        else setOutput(result.plaintext);
      }
    } finally {
      setBusy(false);
    }
  }

  const note = mode === "encrypt" ? "AES-256-GCM · PBKDF2-SHA256" : "Paste a bundle to open it";

  return (
    <ToolCard>
      <ToolToolbar
        label="Mode"
        options={[
          { value: "encrypt", label: "Encrypt" },
          { value: "decrypt", label: "Decrypt" },
        ]}
        value={mode}
        onChange={(next) => {
          setMode(next);
          setOutput("");
          setError("");
        }}
      />
      <ToolPanes>
        <Pane label="Input">
          {mode === "encrypt" ? (
            <FieldRow label="Plaintext" htmlFor="aes-text">
              <TextArea
                id="aes-text"
                value={plaintext}
                onChange={(event) => setPlaintext(event.target.value)}
                rows={8}
                placeholder="Text to encrypt…"
                spellCheck={false}
              />
            </FieldRow>
          ) : (
            <FieldRow label="Bundle" htmlFor="aes-bundle" help="Base64 bundle from a previous encryption.">
              <TextArea
                id="aes-bundle"
                value={bundle}
                onChange={(event) => setBundle(event.target.value)}
                rows={8}
                placeholder="Paste the base64 bundle…"
                spellCheck={false}
                className="font-mono text-[12.5px]"
              />
            </FieldRow>
          )}
          <FieldRow label="Passphrase" htmlFor="aes-pass">
            <div className="flex gap-2">
              <TextInput
                id="aes-pass"
                type={showPassphrase ? "text" : "password"}
                value={passphrase}
                onChange={(event) => setPassphrase(event.target.value)}
                placeholder="A strong passphrase"
                autoComplete="off"
              />
              <ChipButton onClick={() => setShowPassphrase((value) => !value)} aria-label={showPassphrase ? "Hide passphrase" : "Show passphrase"}>
                {showPassphrase ? <EyeOff size={14} /> : <Eye size={14} />}
              </ChipButton>
            </div>
          </FieldRow>
          {mode === "encrypt" ? (
            <FieldRow label={`PBKDF2 iterations ${iterations.toLocaleString()}`} htmlFor="aes-iter" help="Higher is slower to brute force.">
              <Slider
                id="aes-iter"
                value={[iterations]}
                min={AES_ITERATIONS_MIN}
                max={AES_ITERATIONS_MAX}
                step={10000}
                onValueChange={(value) => setIterations(value[0] ?? iterations)}
              />
            </FieldRow>
          ) : null}
          <ActionButton className="btn btn-ink" onClick={() => void run()} disabled={busy}>
            {busy ? "Working…" : mode === "encrypt" ? "Encrypt" : "Decrypt"}
          </ActionButton>
        </Pane>
        <Pane label="Output" actions={output ? <CopyButton value={output} label={mode === "encrypt" ? "Copy bundle" : "Copy text"} /> : undefined}>
          {error ? <Notice tone="bad" role="alert" title={error} /> : null}
          {!output && !error ? (
            <EmptyState
              art={<Lock size={22} />}
              title={mode === "encrypt" ? "Nothing encrypted yet" : "Nothing decrypted yet"}
              hint={mode === "encrypt" ? "Enter text and a passphrase, then press Encrypt." : "Paste a bundle and its passphrase, then press Decrypt."}
            />
          ) : output ? (
            <TextArea value={output} readOnly rows={10} spellCheck={false} className="font-mono text-[12.5px]" aria-label="Result" />
          ) : null}
          {mode === "encrypt" && output ? (
            <Notice tone="neutral" title="Fresh salt and IV" body="Encrypting the same text twice gives a different bundle. There is no way to recover the text without the passphrase." />
          ) : null}
        </Pane>
      </ToolPanes>
      <StatusStrip note={note} tone={error ? "warn" : "pass"} />
    </ToolCard>
  );
}
