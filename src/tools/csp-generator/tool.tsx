"use client";

import { useMemo, useState } from "react";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { ChipButton, TextArea, TextInput, Toggle } from "@/components/kit/controls";
import { CheckRows } from "@/components/kit/check-row";
import { CodeOutput } from "@/components/kit/code-output";
import { FieldRow } from "@/components/kit/field-row";
import { OptionRow } from "@/components/kit/controls";
import { InkButton, Panel, ToolShell, useWorkbenchKeys } from "@/components/kit/tool-shell";
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
      void navigator.clipboard.writeText(doc.header).then(() => toast.success("Header copied"));
    },
  });

  return (
    <ToolShell
      runsLocally
      layout="split"
      actions={<InkButton icon={<Shield size={15} />} onClick={() => void navigator.clipboard.writeText(doc.header).then(() => toast.success("Header copied"))}>Copy header</InkButton>}
      status={
        <>
          <span className="dot" />
          <span>{doc.checks.filter((check) => check.level === "fail" || check.level === "warn").length} notes</span>
        </>
      }
      input={
        <Panel title="Directives">
          <div className="flex flex-wrap gap-2">
            <ChipButton onClick={() => apply(strictPreset)}>Strict</ChipButton>
            <ChipButton onClick={() => apply(nextPreset)}>Next.js</ChipButton>
          </div>
          <FieldRow label="Paste a policy" htmlFor="csp-paste" help="Replaces the fields when you leave the box.">
            <TextArea
              id="csp-paste"
              value={pasted}
              className="min-h-16 font-mono"
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
        </Panel>
      }
      output={
        <Panel title="Header">
          <CodeOutput code={doc.header} label="Content-Security-Policy" />
          <CodeOutput code={doc.nextConfig} filename="next.config.ts" label="next.config.ts" />
          <CheckRows rows={doc.checks} />
        </Panel>
      }
    />
  );
}
