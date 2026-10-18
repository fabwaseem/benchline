"use client";

import { useMemo, useState } from "react";
import { ChipButton, OptionRow, TextInput, Toggle } from "@/components/kit/controls";
import { CodeEditor } from "@/components/kit/code-viewer";
import { CodeOutput } from "@/components/kit/code-output";
import { CopyButton } from "@/components/kit/copy-button";
import { FieldRow } from "@/components/kit/field-row";
import { Pane, ResultsTable, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { documentFor, nextPreset, parsePolicy, sourceDirectives, strictPreset, type CspDraft, type SourceDirective } from "@/tools/csp-generator/lib/csp";

export default function CspTool() {
  const [draft, setDraft] = useState<CspDraft>(strictPreset);
  const [pasted, setPasted] = useState("");
  const doc = useMemo(() => documentFor(draft), [draft]);

  function setSource(name: SourceDirective, value: string) {
    setDraft({ ...draft, sources: { ...draft.sources, [name]: value } });
  }

  function apply(next: CspDraft) {
    setDraft(next);
    setPasted("");
  }

  useWorkbenchKeys({
    onCopy: () => {
      void navigator.clipboard.writeText(doc.header);
    },
  });

  const notes = doc.checks.filter((check) => check.level === "fail" || check.level === "warn").length;

  return (
    <ToolCard>
      <ToolToolbar actions={<CopyButton value={doc.header} label="Copy header" toastMessage="Header copied" />} />
      <ToolPanes ratio="40/60">
        <Pane label="Directives">
          <div className="flex flex-wrap gap-2">
            <ChipButton onClick={() => apply(strictPreset)}>Strict</ChipButton>
            <ChipButton onClick={() => apply(nextPreset)}>Next.js</ChipButton>
          </div>
          <FieldRow label="Paste a policy" htmlFor="csp-paste" help="Replaces the fields when you leave the box.">
            <CodeEditor
              id="csp-paste"
              label="Policy"
              language="plaintext"
              value={pasted}
              onChange={(event) => setPasted(event.target.value)}
              onBlur={() => {
                if (!pasted.trim()) return;
                const parsed = parsePolicy(pasted);
                setDraft({ sources: parsed.sources, upgradeInsecureRequests: parsed.upgradeInsecureRequests, blockAllMixedContent: parsed.blockAllMixedContent });
              }}
            />
          </FieldRow>
          {sourceDirectives.map((name) => (
            <FieldRow key={name} label={name} htmlFor={`csp-${name}`}>
              <TextInput id={`csp-${name}`} value={draft.sources[name] ?? ""} className="font-mono" onChange={(event) => setSource(name, event.target.value)} />
            </FieldRow>
          ))}
          <OptionRow label="upgrade-insecure-requests">
            <Toggle checked={draft.upgradeInsecureRequests} aria-label="upgrade-insecure-requests" onCheckedChange={(value) => setDraft({ ...draft, upgradeInsecureRequests: value })} />
          </OptionRow>
          <OptionRow label="block-all-mixed-content">
            <Toggle checked={draft.blockAllMixedContent} aria-label="block-all-mixed-content" onCheckedChange={(value) => setDraft({ ...draft, blockAllMixedContent: value })} />
          </OptionRow>
        </Pane>
        <Pane label="Header" padded={false} scroll={false} bodyClassName="flex min-h-[280px] flex-col">
          <div className="flex flex-col gap-3 border-b border-border p-3">
            <CodeOutput code={doc.header} label="Content-Security-Policy" />
            <CodeOutput code={doc.nextConfig} filename="next.config.ts" label="next.config.ts" />
          </div>
          <ResultsTable rows={doc.checks} empty="No notes for this policy." />
        </Pane>
      </ToolPanes>
      <StatusStrip
        note={`${notes} ${notes === 1 ? "note" : "notes"}`}
        tone={notes > 0 ? "warn" : "pass"}
        trailing="⌘⇧C copy header"
      />
    </ToolCard>
  );
}
