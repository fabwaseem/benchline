"use client";

import { useMemo, useState } from "react";
import { Regex } from "lucide-react";
import { OptionRow, TextInput } from "@/components/kit/controls";
import { CodeEditor } from "@/components/kit/code-viewer";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Pane, StatusStrip, ToolCard, ToolPanes, Truncate } from "@/components/kit/shell";
import { examplePattern, exampleText, flagList, highlightSpans, testRegex, type Flag } from "@/tools/regex-tester/lib/regex";

export default function RegexTesterTool() {
  const [pattern, setPattern] = useState(examplePattern);
  const [flags, setFlags] = useState<Flag[]>(["g"]);
  const [text, setText] = useState(exampleText);
  const [replacement, setReplacement] = useState("");
  const flagText = flags.join("");
  const result = useMemo(
    () => testRegex(pattern, flagText, text, replacement.length > 0 ? replacement : undefined),
    [flagText, pattern, replacement, text],
  );

  function toggle(flag: Flag, on: boolean) {
    setFlags((current) => {
      const next = new Set(current);
      if (on) next.add(flag);
      else next.delete(flag);
      if (flag === "u" && on) next.delete("v");
      if (flag === "v" && on) next.delete("u");
      return flagList.filter((item) => next.has(item));
    });
  }

  const note = result.valid
    ? `${result.matches.length} match${result.matches.length === 1 ? "" : "es"}${result.truncated ? " · list capped" : ""}`
    : result.error;

  return (
    <ToolCard>
      <ToolPanes>
        <Pane label="Pattern">
          <FieldRow label="Expression" htmlFor="regex-pattern" error={result.valid ? undefined : result.error}>
            <TextInput id="regex-pattern" value={pattern} onChange={(event) => setPattern(event.target.value)} spellCheck={false} className="font-mono" aria-invalid={!result.valid} />
          </FieldRow>
          <div className="flex flex-col">
            {flagList.map((flag) => (
              <OptionRow key={flag} label={flag} checked={flags.includes(flag)} onChange={(on) => toggle(flag, on)} />
            ))}
          </div>
          <FieldRow label="Sample" htmlFor="regex-text">
            <CodeEditor id="regex-text" label="Sample" language="plaintext" value={text} onChange={(event) => setText(event.target.value)} />
          </FieldRow>
          <FieldRow label="Replacement" htmlFor="regex-replace" help="Optional. $1 and $<name> follow JavaScript.">
            <TextInput id="regex-replace" value={replacement} onChange={(event) => setReplacement(event.target.value)} spellCheck={false} className="font-mono" />
          </FieldRow>
        </Pane>
        <Pane label="Matches">
          <div aria-live="polite" className="flex flex-col gap-3">
            {!result.valid ? (
              <>
                <Notice tone="bad" role="alert" title={result.error} />
                <EmptyState art={<Regex size={22} />} title="No matches" hint="Fix the pattern. Leave the slashes out." />
              </>
            ) : (
              <>
                <p className="font-mono text-[13px] leading-6 break-words whitespace-pre-wrap">
                  {highlightSpans(text, result.matches).map((span, index) => (
                    <span key={`${index}-${span.text.slice(0, 8)}`} className={span.match ? "rounded-sm bg-[color-mix(in_srgb,var(--success)_28%,transparent)]" : undefined}>{span.text}</span>
                  ))}
                </p>
                {result.matches.length === 0 ? <p className="text-sm text-muted-foreground">No match in this sample.</p> : (
                  <ul className="text-sm">
                    {result.matches.map((match, index) => (
                      <li key={`${match.index}-${index}`} className="border-t border-border py-2">
                        <div className="flex min-w-0 items-baseline gap-2 font-mono text-[12.5px]">
                          <Truncate value={match.value || "empty"} className="font-mono" />
                          <span className="shrink-0 text-muted-foreground whitespace-nowrap">at {match.index}</span>
                        </div>
                        {match.groups.length > 0 ? (
                          <Truncate value={match.groups.map((group) => `${group.name}: ${group.value || "empty"}`).join(" · ")} className="mt-1 text-[12px] text-muted-foreground" />
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
                {result.replacement !== null ? (
                  <>
                    <p className="text-xs font-medium tracking-tight text-muted-foreground">Replacement</p>
                    <p className="font-mono text-[13px] break-words whitespace-pre-wrap">{result.replacement}</p>
                  </>
                ) : null}
                {result.replaceError ? <Notice tone="bad" role="alert" title={result.replaceError} /> : null}
                <p className="text-xs font-medium tracking-tight text-muted-foreground">Explanation</p>
                <ol className="list-decimal pl-4 text-[13px] text-muted-foreground">
                  {result.explanation.map((line, index) => <li key={`${index}-${line}`} className="break-words whitespace-pre-wrap">{line}</li>)}
                </ol>
              </>
            )}
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip note={note} tone={result.valid ? "pass" : "fail"} />
    </ToolCard>
  );
}
