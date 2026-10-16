"use client";

import { useState } from "react";
import { CodeOutput } from "@/components/kit/code-output";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Segmented } from "@/components/kit/segmented";
import { ToolShell } from "@/components/kit/tool-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { postTool } from "@/lib/post-tool";

type Result = { pages: number; llms: string; full: string };

export default function LlmsTool() {
  const [mode, setMode] = useState<"site" | "urls">("site");
  const [url, setUrl] = useState("https://example.com");
  const [urls, setUrls] = useState("");
  const [llms, setLlms] = useState("");
  const [full, setFull] = useState("");
  const [file, setFile] = useState<"llms" | "full">("llms");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pages, setPages] = useState(0);

  async function run() {
    setBusy(true);
    setError("");
    try {
      const result = await postTool<Result>("/api/tools/llms-txt", { mode, url, urls });
      setLlms(result.llms);
      setFull(result.full);
      setPages(result.pages);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The generator failed.");
    } finally {
      setBusy(false);
    }
  }

  const text = file === "llms" ? llms : full;

  return (
    <ToolShell
      runsLocally={false}
      actions={
        <Button type="button" onClick={() => void run()} disabled={busy}>
          {busy ? "Reading" : "Generate"}
        </Button>
      }
      input={
        <>
          <Segmented label="Source" value={mode} onChange={setMode} options={[{ value: "site", label: "Site URL" }, { value: "urls", label: "Paste URLs" }]} />
          {mode === "site" ? (
            <FieldRow label="Site URL" htmlFor="llms-url" help="A bare domain is fine. Up to 30 pages. Private addresses are refused.">
              <Input id="llms-url" value={url} onChange={(event) => setUrl(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void run(); }} />
            </FieldRow>
          ) : (
            <FieldRow label="Page URLs" htmlFor="llms-urls" help="One URL per line, up to 30.">
              <Textarea id="llms-urls" value={urls} onChange={(event) => setUrls(event.target.value)} className="min-h-40" />
            </FieldRow>
          )}
        </>
      }
      output={
        text ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">{pages} pages</p>
            <Segmented label="File" value={file} onChange={setFile} options={[{ value: "llms", label: "llms.txt" }, { value: "full", label: "llms-full.txt" }]} />
            <Textarea aria-label="Editable preview" value={text} onChange={(event) => (file === "llms" ? setLlms(event.target.value) : setFull(event.target.value))} className="min-h-64 font-mono text-xs" />
            <CodeOutput code={text} filename={file === "llms" ? "llms.txt" : "llms-full.txt"} label={file === "llms" ? "llms.txt" : "llms-full.txt"} />
          </div>
        ) : (
          <EmptyState title={error || "The file shows up here"} hint="Submit a public site, or paste page URLs. You can edit the preview before you copy it." />
        )
      }
    />
  );
}
