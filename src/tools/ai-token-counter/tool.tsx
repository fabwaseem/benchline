"use client";

import { useEffect, useMemo, useState } from "react";
import { Coins, Copy } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/kit/copy-button";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Segmented } from "@/components/kit/segmented";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { costMarkdown, money, priceSelected } from "@/tools/ai-token-counter/lib/cost";
import { MODELS, PRICES_UPDATED } from "@/tools/ai-token-counter/lib/prices";
import type { EncodingName } from "@/tools/ai-token-counter/lib/tokenize";

const SAMPLE = "A token is the unit a model reads and bills. This sentence stays in your browser.";

type Count = { count: number; chars: number; words: number; segments: string[] };

export default function TokenTool() {
  const [text, setText] = useState(SAMPLE);
  const [encoding, setEncoding] = useState<EncodingName>("o200k");
  const [ids, setIds] = useState<string[]>(MODELS.slice(0, 5).map((model) => model.id));
  const [more, setMore] = useState(false);
  const [outputTokens, setOutputTokens] = useState(500);
  const [requests, setRequests] = useState(100);
  const [cached, setCached] = useState(0);
  const [showTokens, setShowTokens] = useState(true);
  const [fileName, setFileName] = useState("");
  const [count, setCount] = useState<Count>({ count: 0, chars: SAMPLE.length, words: SAMPLE.split(/\s+/).filter(Boolean).length, segments: [] });

  useEffect(() => {
    const worker = new Worker(new URL("./tokenizer.worker.ts", import.meta.url));
    const id = 1;
    worker.onmessage = (event: MessageEvent<Count & { id: number }>) => {
      if (event.data.id !== id) return;
      setCount(event.data);
    };
    worker.postMessage({ id, text, encoding, preview: showTokens ? 2000 : 0 });
    return () => worker.terminate();
  }, [encoding, showTokens, text]);

  const rows = useMemo(
    () => priceSelected({ ids, inputTokens: count.count, outputTokens, cachedRatio: cached / 100, requestsPerDay: requests }),
    [cached, count.count, ids, outputTokens, requests],
  );
  const markdown = costMarkdown(rows);
  const long = rows.some((row) => row.longContext);
  const shown = more ? MODELS : MODELS.filter((model) => ids.includes(model.id));
  const hidden = MODELS.length - shown.length;

  useWorkbenchKeys({
    onCopy: () => {
      void navigator.clipboard.writeText(markdown).then(() => toast.success("Table copied"));
    },
    onEscape: () => {
      setText("");
      setFileName("");
    },
  });

  const status = text.trim()
    ? `${count.count.toLocaleString("en-US")} tokens · ${encoding === "o200k" ? "o200k_base" : "cl100k_base"}`
    : "Waiting for a prompt";

  return (
    <ToolShell
      runsLocally
      layout="split+inspector"
      flow="band"
      columns="min-[1280px]:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_300px]"
      tabs={<ToolTabs label="Mode" value="count" onChange={() => {}} options={[{ value: "count", label: "Count" }]} />}
      actions={<InkButton disabled={!text.trim()} icon={<Copy size={15} />} onClick={() => void navigator.clipboard.writeText(markdown).then(() => toast.success("Table copied"))}>Copy as Markdown</InkButton>}
      status={
        <>
          <span className="dot" />
          <span>{status}</span>
          <span className="ml-auto hidden min-[700px]:inline">⌘⇧C copy table · esc clear</span>
        </>
      }
      input={
        <Panel title="Prompt">
          <FieldRow label="Prompt" htmlFor="tokens" help="Nothing is uploaded. The tokenizer runs in a worker.">
            {showTokens && count.segments.length > 0 && count.segments.join("") === text ? (
              <div className="relative">
                <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden px-3 py-2 font-mono text-[12.5px] leading-6 break-all whitespace-pre-wrap">
                  {count.segments.map((segment, index) => (
                    <span key={`${index}-${segment.slice(0, 8)}`} className={index % 2 === 0 ? "bg-foreground/10" : "bg-foreground/5"}>{segment}</span>
                  ))}
                </div>
                <Textarea id="tokens" value={text} onChange={(event) => { setFileName(""); setText(event.target.value); }} className="min-h-40 bg-transparent font-mono text-[12.5px] leading-6 text-transparent caret-foreground" />
              </div>
            ) : (
              <Textarea id="tokens" value={text} onChange={(event) => { setFileName(""); setText(event.target.value); }} className="min-h-40" />
            )}
          </FieldRow>
          <Dropzone accept=".txt,.md,.json,text/plain" label="Drop a .txt, .md, or .json file" onFile={(file) => {
            setFileName(file.name);
            void file.text().then(setText);
          }} />
          {fileName ? <p className="font-mono text-[12px] text-muted-foreground">{fileName}</p> : null}
          <button type="button" className="text-left text-[12.5px] text-muted-foreground underline-offset-2 hover:underline" onClick={() => setShowTokens((value) => !value)}>
            {showTokens ? "Hide" : "Show"} token boundaries
          </button>
          <div className="grid grid-cols-3 gap-2">
            <ResultStat variant="well" label="Tokens" value={count.count.toLocaleString("en-US")} />
            <ResultStat variant="well" label="Characters" value={count.chars.toLocaleString("en-US")} />
            <ResultStat variant="well" label="Words" value={count.words.toLocaleString("en-US")} />
          </div>
          <Segmented label="Tokenizer" value={encoding} onChange={setEncoding} options={[{ value: "o200k", label: "o200k_base" }, { value: "cl100k", label: "cl100k_base" }]} />
        </Panel>
      }
      output={
        <div aria-live="polite">
          {text.trim() ? (
            <Panel title="Cost">
              {long ? <Notice tone="warn" title="A long-context rate applies to at least one model." /> : null}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="font-mono text-[11px] text-muted-foreground">
                    <tr><th className="py-2">Model</th><th>Request</th><th className="max-[699px]:hidden">Month</th></tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.model.id} className="border-t border-border">
                        <td className="py-2 pr-2">
                          <p className="font-medium">{row.model.label}</p>
                          <p className="text-xs text-muted-foreground">{row.model.tokenizer === "estimate" ? "estimate ≈ o200k · " : ""}{row.longContext ? "long-context rate · " : ""}{row.overContext ? "over context" : ""}</p>
                        </td>
                        <td className="font-mono tabular-nums">{money(row.requestUsd)}</td>
                        <td className="font-mono tabular-nums max-[699px]:hidden">{money(row.monthUsd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[12px] text-muted-foreground">Claude, Gemini, and other non-OpenAI counts are o200k estimates. Prices checked {PRICES_UPDATED}.</p>
            </Panel>
          ) : (
            <EmptyState art={<Coins size={22} />} title="The table shows up here" hint={`Prices checked ${PRICES_UPDATED}. Paste a prompt to price it.`} />
          )}
        </div>
      }
      inspector={
        <Panel title="Assumptions">
          <div className="grid gap-3">
            <FieldRow label="Output tokens" htmlFor="out-tokens"><Input id="out-tokens" type="number" min={0} value={outputTokens} onChange={(event) => setOutputTokens(Number(event.target.value) || 0)} className="max-[699px]:h-11" /></FieldRow>
            <FieldRow label="Requests / day" htmlFor="req-day"><Input id="req-day" type="number" min={0} value={requests} onChange={(event) => setRequests(Number(event.target.value) || 0)} className="max-[699px]:h-11" /></FieldRow>
            <FieldRow label={`Cached input ${cached}%`} htmlFor="cache">
              <Slider id="cache" value={[cached]} min={0} max={100} onValueChange={(value) => setCached(Array.isArray(value) ? value[0] ?? 0 : value)} />
            </FieldRow>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {shown.map((model) => {
              const on = ids.includes(model.id);
              return (
                <button key={model.id} type="button" aria-pressed={on} data-on={on ? "true" : "false"} className="chip" onClick={() => setIds(on ? ids.filter((id) => id !== model.id) : [...ids, model.id])}>
                  {model.label}
                </button>
              );
            })}
            {hidden > 0 ? <button type="button" className="chip" onClick={() => setMore(true)}>+{hidden}</button> : null}
          </div>
          <CopyButton value={markdown} label="Copy as Markdown" toastMessage="Table copied" />
        </Panel>
      }
    />
  );
}
