"use client";

import { useMemo, useState } from "react";
import { CaseSensitive } from "lucide-react";
import { CopyButton } from "@/components/kit/copy-button";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Panel, ToolShell } from "@/components/kit/tool-shell";
import { Textarea } from "@/components/ui/textarea";
import { convertAllCases, exampleText } from "@/tools/case-converter/lib/case";

export default function CaseConverterTool() {
  const [text, setText] = useState(exampleText);
  const cases = useMemo(() => convertAllCases(text), [text]);

  return (
    <ToolShell
      runsLocally
      layout="split"
      status={
        <>
          <span className="dot" />
          <span>{cases.length} cases</span>
        </>
      }
      input={
        <Panel title="Text">
          <FieldRow label="Phrase" htmlFor="case-text" help="Blank lines stay blank. Each other line is converted on its own.">
            <Textarea id="case-text" value={text} onChange={(event) => setText(event.target.value)} className="min-h-48" />
          </FieldRow>
        </Panel>
      }
      output={
        <div aria-live="polite">
          {text.length === 0 ? (
            <Panel>
              <EmptyState art={<CaseSensitive size={22} />} title="Nothing to convert" hint="Paste a title or an identifier." />
            </Panel>
          ) : (
            <Panel title="Cases">
              <ul>
                {cases.map((item) => (
                  <li key={item.style} className="flex items-start gap-3 border-t border-border py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] tracking-tight text-muted-foreground">{item.label}</div>
                      <p className="mt-1 font-mono text-[13px] break-all">{item.text || " "}</p>
                    </div>
                    <CopyButton value={item.text} label="Copy" />
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      }
    />
  );
}
