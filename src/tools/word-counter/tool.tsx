"use client";

import { useMemo, useState } from "react";
import { WholeWord } from "lucide-react";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Meter } from "@/components/kit/meter";
import { ResultStat } from "@/components/kit/result-stat";
import { Panel, ToolShell } from "@/components/kit/tool-shell";
import { Textarea } from "@/components/ui/textarea";
import { countText, exampleText } from "@/tools/word-counter/lib/count";

export default function WordCounterTool() {
  const [text, setText] = useState(exampleText);
  const counts = useMemo(() => countText(text), [text]);

  return (
    <ToolShell
      runsLocally
      layout="split"
      status={
        <>
          <span className="dot" />
          <span>{counts.words.toLocaleString("en-US")} words · {counts.characters.toLocaleString("en-US")} characters · {counts.readingLabel} to read</span>
        </>
      }
      input={
        <Panel title="Text">
          <FieldRow label="Draft" htmlFor="word-text" help="Counts update as you type. The text stays in the browser.">
            <Textarea id="word-text" value={text} onChange={(event) => setText(event.target.value)} className="min-h-72" />
          </FieldRow>
        </Panel>
      }
      output={
        <div aria-live="polite">
          {text.length === 0 ? (
            <Panel>
              <EmptyState art={<WholeWord size={22} />} title="Nothing to count" hint="Paste a title, a caption, or a paragraph." />
            </Panel>
          ) : (
            <Panel title="Counts">
              <div className="grid grid-cols-2 gap-2">
                <ResultStat label="Words" value={String(counts.words)} hint={`${counts.uniqueWords} unique`} />
                <ResultStat label="Characters" value={String(counts.characters)} hint={`${counts.charactersNoSpaces} without spaces`} />
                <ResultStat label="Graphemes" value={String(counts.graphemes)} hint="What a reader sees" />
                <ResultStat label="Sentences" value={String(counts.sentences)} hint={`${counts.paragraphs} paragraphs · ${counts.lines} lines`} />
                <ResultStat label="Reading" value={counts.readingLabel} hint="238 words per minute" />
                <ResultStat label="Speaking" value={counts.speakingLabel} hint="150 words per minute" />
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {counts.platforms.map((platform) => (
                  <Meter key={platform.id} label={platform.label} value={platform.count} max={platform.limit} hint={platform.over ? "Over the limit" : undefined} />
                ))}
              </div>
            </Panel>
          )}
        </div>
      }
    />
  );
}
