"use client";

import { useMemo, useState } from "react";
import { WholeWord } from "lucide-react";
import { TextArea } from "@/components/kit/controls";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Meter } from "@/components/kit/meter";
import { ResultStat } from "@/components/kit/result-stat";
import { Pane, StatusStrip, ToolCard, ToolPanes } from "@/components/kit/shell";
import { countText, exampleText } from "@/tools/word-counter/lib/count";

export default function WordCounterTool() {
  const [text, setText] = useState(exampleText);
  const counts = useMemo(() => countText(text), [text]);
  const over = counts.platforms.filter((platform) => platform.over);
  const empty = text.length === 0;

  return (
    <ToolCard>
      <ToolPanes>
        <Pane label="Text">
          <FieldRow label="Draft" htmlFor="word-text" help="Counts update as you type. The text stays in the browser.">
            <TextArea id="word-text" value={text} onChange={(event) => setText(event.target.value)} className="min-h-72" />
          </FieldRow>
        </Pane>
        <Pane label="Counts">
          <div aria-live="polite" className="flex flex-col gap-3">
            {empty ? (
              <EmptyState art={<WholeWord size={22} />} title="Nothing to count" hint="Paste a title, a caption, or a paragraph." />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <ResultStat label="Words" value={String(counts.words)} hint={`${counts.uniqueWords} unique`} />
                  <ResultStat label="Characters" value={String(counts.characters)} hint={`${counts.charactersNoSpaces} without spaces`} />
                  <ResultStat label="Graphemes" value={String(counts.graphemes)} hint="What a reader sees" />
                  <ResultStat label="Sentences" value={String(counts.sentences)} hint={`${counts.paragraphs} paragraphs · ${counts.lines} lines`} />
                  <ResultStat label="Reading" value={counts.readingLabel} hint="238 words per minute" />
                  <ResultStat label="Speaking" value={counts.speakingLabel} hint="150 words per minute" />
                </div>
                <div className="flex flex-col gap-3">
                  {counts.platforms.map((platform) => (
                    <Meter key={platform.id} label={platform.label} value={platform.count} max={platform.limit} hint={platform.over ? "Over the limit" : undefined} />
                  ))}
                </div>
              </>
            )}
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip
        note={empty ? "Nothing to count" : `${counts.words.toLocaleString("en-US")} words · ${counts.characters.toLocaleString("en-US")} characters · ${counts.readingLabel} to read`}
        tone={empty ? "info" : over.length > 0 ? "warn" : "pass"}
        items={over.map((platform) => ({ level: "warn", label: platform.label, detail: `${platform.count.toLocaleString("en-US")} / ${platform.limit.toLocaleString("en-US")}` }))}
      />
    </ToolCard>
  );
}
