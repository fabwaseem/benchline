"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { CodeField, CodeOutput } from "@/components/kit/code-output";
import { ActionButton } from "@/components/kit/controls";
import { DownloadButton } from "@/components/kit/download-button";
import { EmptyState } from "@/components/kit/empty-state";
import { ErrorCallout, Notice } from "@/components/kit/notice";
import { KvList } from "@/components/kit/kv-list";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import {
  convertCurl,
  exampleCurl,
  TARGET_LABELS,
  TARGETS,
  type Target,
} from "@/tools/curl-converter/lib/curl";

const FILENAMES: Record<Target, string> = {
  fetch: "request.js",
  python: "request.py",
  go: "request.go",
  php: "request.php",
  rust: "request.rs",
};

export default function CurlConverterTool() {
  const [command, setCommand] = useState(exampleCurl);
  const [target, setTarget] = useState<Target>("fetch");

  const result = useMemo(() => convertCurl(command, target), [command, target]);
  const error = "error" in result ? result.error : null;
  const snippet = "error" in result ? "" : result.snippet;
  const request = "error" in result ? null : result.request;
  const warnings = "error" in result ? [] : result.warnings;

  useWorkbenchKeys({
    onCopy: () => {
      if (!snippet) return;
      void navigator.clipboard.writeText(snippet).then(() => toast.success(`${TARGET_LABELS[target]} copied`));
    },
    onEscape: () => setCommand(exampleCurl),
  });

  const status = error
    ? `Error — ${error}`
    : request
      ? `${request.method} ${request.url}`
      : "Paste a curl command.";

  return (
    <ToolCard>
      <ToolToolbar
        label="Target"
        options={TARGETS.map((t) => ({ value: t, label: TARGET_LABELS[t] }))}
        value={target}
        onChange={(value) => setTarget(value as Target)}
        actions={
          <>
            <ActionButton variant="outline" onClick={() => setCommand(exampleCurl)}>Sample</ActionButton>
            <ActionButton variant="ghost" onClick={() => setCommand("")}>Clear</ActionButton>
            <ActionButton
              className="btn btn-ink"
              disabled={!snippet}
              onClick={() => void navigator.clipboard.writeText(snippet).then(() => toast.success(`${TARGET_LABELS[target]} copied`))}
            >
              Copy
            </ActionButton>
            <DownloadButton filename={FILENAMES[target]} content={snippet} label="Download" disabled={!snippet} />
          </>
        }
      />
      <ToolPanes>
        <Pane label="cURL" scroll={false} bodyClassName="flex min-h-[340px] flex-col gap-3 p-3">
          <CodeField
            id="curl-input"
            label="curl command"
            value={command}
            invalid={Boolean(error)}
            onChange={(event) => setCommand(event.target.value)}
            className="min-h-0 flex-1 font-mono"
          />
          {request ? (
            <KvList
              items={[
                { name: "Method", value: request.method },
                { name: "URL", value: request.url },
                ...request.headers.map((h) => ({ name: h.name, value: h.value })),
                ...(request.body !== undefined ? [{ name: "Body", value: request.body }] : []),
              ]}
            />
          ) : null}
        </Pane>
        <Pane label={error ? "Error" : TARGET_LABELS[target]} scroll={false} bodyClassName="flex min-h-[340px] flex-col gap-3 p-3">
          {error ? (
            <>
              <ErrorCallout title="Could not parse" body={error} />
              <EmptyState art={<ArrowLeftRight size={22} />} title="Nothing to convert" hint="Paste a command starting with curl." />
            </>
          ) : (
            <>
              {warnings.map((warning) => (
                <Notice key={warning} tone="warn" title="Heads up" body={warning} />
              ))}
              <CodeOutput code={snippet} filename={FILENAMES[target]} label={TARGET_LABELS[target]} fill className="min-h-0 flex-1" />
            </>
          )}
        </Pane>
      </ToolPanes>
      <StatusStrip note={status} tone={error ? "fail" : "pass"} trailing="⌘⇧C copy · esc reset" />
    </ToolCard>
  );
}
