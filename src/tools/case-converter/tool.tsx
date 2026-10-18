"use client";

import { useMemo, useState } from "react";
import { CaseSensitive } from "lucide-react";
import { TextArea } from "@/components/kit/controls";
import { CopyButton } from "@/components/kit/copy-button";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Pane, StatusStrip, ToolCard, ToolPanes, Truncate } from "@/components/kit/shell";
import { convertAllCases, exampleText } from "@/tools/case-converter/lib/case";

export default function CaseConverterTool() {
  const [text, setText] = useState(exampleText);
  const cases = useMemo(() => convertAllCases(text), [text]);
  const empty = text.length === 0;

  return (
    <ToolCard>
      <ToolPanes>
        <Pane label="Text">
          <FieldRow label="Phrase" htmlFor="case-text" help="Blank lines stay blank. Each other line is converted on its own.">
            <TextArea id="case-text" value={text} onChange={(event) => setText(event.target.value)} className="min-h-48" />
          </FieldRow>
        </Pane>
        <Pane label="Cases">
          <div aria-live="polite">
            {empty ? (
              <EmptyState art={<CaseSensitive size={22} />} title="Nothing to convert" hint="Paste a title or an identifier." />
            ) : (
              <ul>
                {cases.map((item) => (
                  <li key={item.style} className="flex items-center gap-3 border-t border-border py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] tracking-tight text-muted-foreground whitespace-nowrap">{item.label}</div>
                      <Truncate value={item.text || " "} className="mt-1 font-mono text-[13px]" />
                    </div>
                    <CopyButton value={item.text} label="Copy" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip note={empty ? "Nothing to convert" : `${cases.length} cases`} tone={empty ? "info" : "pass"} />
    </ToolCard>
  );
}
