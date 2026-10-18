"use client";

import { useMemo, useState } from "react";
import { Regex } from "lucide-react";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Panel, ToolShell } from "@/components/kit/tool-shell";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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

  return (
    <ToolShell
      runsLocally
      layout="split"
      status={
        <>
          <span className={!result.valid ? "dot dot-warn" : "dot"} />
          <span>{result.valid ? `${result.matches.length} matches${result.truncated ? ", list capped" : ""}` : result.error}</span>
        </>
      }
      input={
        <Panel title="Pattern">
          <FieldRow label="Expression" htmlFor="regex-pattern" error={result.valid ? undefined : result.error}>
            <Input id="regex-pattern" value={pattern} onChange={(event) => setPattern(event.target.value)} spellCheck={false} className="font-mono" aria-invalid={!result.valid} />
          </FieldRow>
          <div className="flex flex-col gap-1">
            {flagList.map((flag) => (
              <label key={flag} className="flex min-h-11 items-center justify-between gap-3 text-sm">
                {flag}
                <Switch checked={flags.includes(flag)} onCheckedChange={(on) => toggle(flag, on)} />
              </label>
            ))}
          </div>
          <FieldRow label="Sample" htmlFor="regex-text">
            <Textarea id="regex-text" value={text} onChange={(event) => setText(event.target.value)} spellCheck={false} className="min-h-40 font-mono text-[13px]" />
          </FieldRow>
          <FieldRow label="Replacement" htmlFor="regex-replace" help="Optional. $1 and $<name> follow JavaScript.">
            <Input id="regex-replace" value={replacement} onChange={(event) => setReplacement(event.target.value)} spellCheck={false} className="font-mono" />
          </FieldRow>
        </Panel>
      }
      output={
        <div aria-live="polite">
          {!result.valid ? (
            <Panel>
              <Notice tone="bad" role="alert" title={result.error} />
              <EmptyState art={<Regex size={22} />} title="No matches" hint="Fix the pattern. Leave the slashes out." />
            </Panel>
          ) : (
            <Panel title="Matches">
              <p className="font-mono text-[13px] leading-6 break-all whitespace-pre-wrap">
                {highlightSpans(text, result.matches).map((span, index) => (
                  <span key={`${index}-${span.text.slice(0, 8)}`} className={span.match ? "rounded-sm bg-[color-mix(in_srgb,var(--success)_28%,transparent)]" : undefined}>{span.text}</span>
                ))}
              </p>
              {result.matches.length === 0 ? <p className="text-sm text-muted-foreground">No match in this sample.</p> : (
                <ul className="text-sm">
                  {result.matches.map((match, index) => (
                    <li key={`${match.index}-${index}`} className="border-t border-border py-2">
                      <div className="font-mono text-[12.5px]">{match.value || "empty"} <span className="text-muted-foreground">at {match.index}</span></div>
                      {match.groups.length > 0 ? (
                        <div className="mt-1 text-[12px] text-muted-foreground">{match.groups.map((group) => `${group.name}: ${group.value || "empty"}`).join(" · ")}</div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              {result.replacement !== null ? (
                <>
                  <p className="text-xs font-medium tracking-tight text-muted-foreground">Replacement</p>
                  <p className="font-mono text-[13px] whitespace-pre-wrap">{result.replacement}</p>
                </>
              ) : null}
              {result.replaceError ? <Notice tone="bad" role="alert" title={result.replaceError} /> : null}
              <p className="text-xs font-medium tracking-tight text-muted-foreground">Explanation</p>
              <ol className="list-decimal pl-4 text-[13px] text-muted-foreground">
                {result.explanation.map((line, index) => <li key={`${index}-${line}`} className="whitespace-pre-wrap">{line}</li>)}
              </ol>
            </Panel>
          )}
        </div>
      }
    />
  );
}
