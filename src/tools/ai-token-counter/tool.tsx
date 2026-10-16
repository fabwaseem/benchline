"use client";

import { useEffect, useMemo, useState } from "react";
import { CodeOutput } from "@/components/kit/code-output";
import { Dropzone } from "@/components/kit/dropzone";
import { FieldRow } from "@/components/kit/field-row";
import { ResultStat } from "@/components/kit/result-stat";
import { Segmented } from "@/components/kit/segmented";
import { ToolShell } from "@/components/kit/tool-shell";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { costMarkdown, money, priceSelected } from "@/tools/ai-token-counter/lib/cost";
import { DEFAULT_MODEL_IDS, MODELS, PRICES_UPDATED } from "@/tools/ai-token-counter/lib/prices";
import type { EncodingName } from "@/tools/ai-token-counter/lib/tokenize";

const SAMPLE = "A token is the unit a model reads and bills. This sentence stays in your browser.";

type Count = { count: number; chars: number; words: number; segments: string[] };

export default function TokenTool() {
  const [text, setText] = useState(SAMPLE);
  const [encoding, setEncoding] = useState<EncodingName>("o200k");
  const [ids, setIds] = useState<string[]>(DEFAULT_MODEL_IDS);
  const [outputTokens, setOutputTokens] = useState(500);
  const [requests, setRequests] = useState(100);
  const [cached, setCached] = useState(0);
  const [showTokens, setShowTokens] = useState(true);
  const [count, setCount] = useState<Count>({ count: 0, chars: SAMPLE.length, words: 0, segments: [] });

  useEffect(() => {
    const worker = new Worker(new URL("./tokenizer.worker.ts", import.meta.url));
    const id = 1;
    worker.onmessage = (event: MessageEvent<Count & { id: number }>) => {
      if (event.data.id === id) setCount(event.data);
    };
    worker.postMessage({ id, text, encoding, preview: 2000 });
    return () => worker.terminate();
  }, [encoding, text]);

  const rows = useMemo(
    () => priceSelected({ ids, inputTokens: count.count, outputTokens, cachedRatio: cached / 100, requestsPerDay: requests }),
    [cached, count.count, ids, outputTokens, requests],
  );

  return (
    <ToolShell runsLocally>
      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <FieldRow label="Prompt" htmlFor="tokens" help="Nothing is uploaded. The tokenizer runs in a worker.">
            <Textarea id="tokens" value={text} onChange={(event) => setText(event.target.value)} className="min-h-40" />
          </FieldRow>
          <Dropzone accept=".txt,.md,.json,text/plain" label="Drop a .txt, .md, or .json file" onFile={(file) => {
            void file.text().then(setText);
          }} />
          <Segmented label="Tokenizer" value={encoding} onChange={setEncoding} options={[{ value: "o200k", label: "o200k_base" }, { value: "cl100k", label: "cl100k_base" }]} />
          <div className="flex gap-1 overflow-x-auto">
            {MODELS.map((model) => {
              const on = ids.includes(model.id);
              return (
                <button key={model.id} type="button" aria-pressed={on} onClick={() => setIds(on ? ids.filter((id) => id !== model.id) : [...ids, model.id])} className={`shrink-0 rounded-full border px-2 py-1 text-xs ${on ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                  {model.label}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Output tokens" htmlFor="out-tokens"><Input id="out-tokens" type="number" min={0} value={outputTokens} onChange={(event) => setOutputTokens(Number(event.target.value) || 0)} /></FieldRow>
            <FieldRow label="Requests / day" htmlFor="req-day"><Input id="req-day" type="number" min={0} value={requests} onChange={(event) => setRequests(Number(event.target.value) || 0)} /></FieldRow>
          </div>
          <FieldRow label={`Cached input ${cached}%`} htmlFor="cache">
            <Slider id="cache" value={[cached]} min={0} max={100} onValueChange={(value) => setCached(Array.isArray(value) ? value[0] ?? 0 : value)} />
          </FieldRow>
        </div>
        <div className="flex flex-col gap-3" aria-live="polite">
          <div className="grid grid-cols-3 gap-2">
            <ResultStat label="Tokens" value={String(count.count)} />
            <ResultStat label="Characters" value={String(count.chars)} />
            <ResultStat label="Words" value={String(count.words)} hint={count.count ? `${(count.chars / count.count).toFixed(2)} chars/token` : ""} />
          </div>
          <button type="button" className="text-left text-xs text-primary" onClick={() => setShowTokens((value) => !value)}>{showTokens ? "Hide" : "Show"} token boundaries</button>
          {showTokens ? (
            <p className="max-h-40 overflow-auto rounded-lg border border-border p-2 font-mono text-xs leading-6">
              {count.segments.map((segment, index) => (
                <span key={`${index}-${segment}`} className={index % 2 === 0 ? "bg-primary/15" : "bg-amber/40"}>{segment}</span>
              ))}
            </p>
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr><th>Model</th><th>Request</th><th>Month</th></tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.model.id} className="border-t border-border">
                    <td className="py-2 pr-2">
                      <p className="font-medium">{row.model.label}</p>
                      <p className="text-xs text-muted-foreground">{row.model.tokenizer === "estimate" ? "estimate ≈ o200k × 1.0 · " : ""}{row.longContext ? "long-context rate · " : ""}{row.overContext ? "over context" : ""}</p>
                      <div className={`mt-1 h-1 rounded-full ${row.overContext ? "bg-destructive" : "bg-primary"}`} style={{ width: `${row.model.contextWindow ? Math.min(100, (count.count / row.model.contextWindow) * 100) : 8}%` }} />
                    </td>
                    <td className="tabular-nums">{money(row.requestUsd)}</td>
                    <td className="tabular-nums">{money(row.monthUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">Prices updated {PRICES_UPDATED}. Confirm the linked provider pages before a large budget.</p>
          <CodeOutput code={costMarkdown(rows)} filename="costs.md" label="Markdown" />
        </div>
      </div>
    </ToolShell>
  );
}
