"use client";

import { useEffect, useState } from "react";
import { ActionButton, ChipButton, OptionRow, TextInput } from "@/components/kit/controls";
import { Copy, Fingerprint } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/kit/copy-button";
import { DownloadButton } from "@/components/kit/download-button";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { generateUuids, inspectUuid, type UuidVersion } from "@/tools/uuid-generator/lib/uuid";

export default function UuidGeneratorTool() {
  const [version, setVersion] = useState<UuidVersion>("v4");
  const [count, setCount] = useState(5);
  const [uppercase, setUppercase] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [ids, setIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [inspect, setInspect] = useState("");

  useEffect(() => {
    const kick = window.setTimeout(() => {
      const next = generateUuids(version, count);
      if ("error" in next) {
        setError(next.error);
        setIds([]);
        return;
      }
      setError("");
      setIds(next);
    }, 0);
    return () => window.clearTimeout(kick);
  }, [count, nonce, version]);

  const shown = ids.map((id) => (uppercase ? id.toUpperCase() : id));
  const text = shown.join("\n");
  const info = inspect.trim() ? inspectUuid(inspect) : null;

  useWorkbenchKeys({
    onCopy: () => {
      if (!text) return;
      void navigator.clipboard.writeText(text).then(() => toast.success("UUIDs copied"));
    },
    onEscape: () => setNonce((value) => value + 1),
  });

  return (
    <ToolCard>
      <ToolToolbar
        label="Version"
        options={[{ value: "v4", label: "UUID v4" }, { value: "v7", label: "UUID v7" }]}
        value={version}
        onChange={setVersion}
        actions={<ActionButton className="btn btn-ink" disabled={!text} onClick={() => void navigator.clipboard.writeText(text).then(() => toast.success("UUIDs copied"))}>Copy all</ActionButton>}
      />
      <ToolPanes>
        <Pane label="Options">
          <FieldRow label="Count" htmlFor="uuid-count" error={error || undefined} help="Up to 10,000. Each id uses crypto.getRandomValues.">
            <TextInput id="uuid-count" type="number" min={1} max={10000} value={count} onChange={(event) => setCount(Number(event.target.value))} aria-invalid={Boolean(error)} />
          </FieldRow>
          <OptionRow label="Uppercase" checked={uppercase} onChange={setUppercase} />
          <ChipButton onClick={() => setNonce((value) => value + 1)}>Generate again</ChipButton>
          <FieldRow label="Inspect a UUID" htmlFor="uuid-inspect">
            <TextInput id="uuid-inspect" value={inspect} onChange={(event) => setInspect(event.target.value)} className="font-mono" placeholder="Paste a UUID" />
          </FieldRow>
          {!info ? <p className="text-sm text-muted-foreground">Paste a UUID to read its version. Version 7 also has a timestamp.</p> : "error" in info ? (
            <Notice tone="bad" role="alert" title={info.error} />
          ) : (
            <>
              <p className="truncate font-mono text-[13px]" title={info.uuid}>{info.uuid}</p>
              <p className="text-sm whitespace-nowrap">Version {info.version} · {info.variant}</p>
              {info.timestamp ? <p className="truncate text-sm text-muted-foreground" title={info.timestamp}>{info.timestamp}</p> : <p className="text-sm text-muted-foreground">This version does not store a timestamp.</p>}
            </>
          )}
        </Pane>
        <Pane label="Identifiers">
          {shown.length === 0 ? (
            <EmptyState art={<Fingerprint size={22} />} title="No ids" hint={error || "Choose a count."} />
          ) : (
            <>
              <ol className="font-mono text-[13px]">
                {shown.map((id) => (
                  <li key={id} className="flex items-center gap-2 border-t border-border py-1.5">
                    <span className="min-w-0 flex-1 truncate" title={id}>{id}</span>
                    <CopyButton value={id} iconOnly icon={<Copy size={14} />} label={`Copy ${id}`} />
                  </li>
                ))}
              </ol>
              <DownloadButton filename="uuids.txt" content={text} label="Download" />
            </>
          )}
        </Pane>
      </ToolPanes>
      <StatusStrip note={error || `${shown.length} ${version} ids`} tone={error ? "warn" : "pass"} />
    </ToolCard>
  );
}
