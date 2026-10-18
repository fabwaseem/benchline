"use client";

import { useEffect, useMemo, useState } from "react";
import { ActionButton, ChipButton, Slider, TextButton, TextInput, TextArea } from "@/components/kit/controls";
import { Coins } from "lucide-react";
import { toast } from "sonner";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { ResultTable } from "@/components/kit/result-table";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
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
    <ToolCard>
      <ToolToolbar
        label="Tokenizer"
        options={[{ value: "o200k", label: "o200k_base" }, { value: "cl100k", label: "cl100k_base" }]}
        value={encoding}
        onChange={setEncoding}
        actions={<ActionButton className="btn btn-ink" disabled={!text.trim()} onClick={() => void navigator.clipboard.writeText(markdown).then(() => toast.success("Table copied"))}>Copy as Markdown</ActionButton>}
      />
      <ToolPanes ratio="40/60">
        <Pane label="Prompt">
          <FieldRow label="Prompt" htmlFor="tokens" help="Nothing is uploaded. The tokenizer runs in a worker.">
            {showTokens && count.segments.length > 0 && count.segments.join("") === text ? (
              <div className="relative">
                <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden px-3 py-2 font-mono text-[12.5px] leading-6 break-all whitespace-pre-wrap">
                  {count.segments.map((segment, index) => (
                    <span key={`${index}-${segment.slice(0, 8)}`} className={index % 2 === 0 ? "bg-foreground/10" : "bg-foreground/5"}>{segment}</span>
                  ))}
                </div>
                <TextArea id="tokens" value={text} onChange={(event) => { setFileName(""); setText(event.target.value); }} className="min-h-40 bg-transparent font-mono text-[12.5px] leading-6 text-transparent caret-foreground" />
              </div>
            ) : (
              <TextArea id="tokens" value={text} onChange={(event) => { setFileName(""); setText(event.target.value); }} className="min-h-40" />
            )}
          </FieldRow>
          <Dropzone accept=".txt,.md,.json,text/plain" label="Drop a .txt, .md, or .json file" onFile={(file) => {
            setFileName(file.name);
            void file.text().then(setText);
          }} />
          {fileName ? <p className="font-mono text-[12px] text-muted-foreground">{fileName}</p> : null}
          <TextButton onClick={() => setShowTokens((value) => !value)}>
            {showTokens ? "Hide" : "Show"} token boundaries
          </TextButton>
          <div className="grid grid-cols-3 gap-2">
            <ResultStat variant="well" label="Tokens" value={count.count.toLocaleString("en-US")} />
            <ResultStat variant="well" label="Characters" value={count.chars.toLocaleString("en-US")} />
            <ResultStat variant="well" label="Words" value={count.words.toLocaleString("en-US")} />
          </div>
          <FieldRow label="Output tokens" htmlFor="out-tokens"><TextInput id="out-tokens" type="number" min={0} value={outputTokens} onChange={(event) => setOutputTokens(Number(event.target.value) || 0)} /></FieldRow>
          <FieldRow label="Requests / day" htmlFor="req-day"><TextInput id="req-day" type="number" min={0} value={requests} onChange={(event) => setRequests(Number(event.target.value) || 0)} /></FieldRow>
          <FieldRow label={`Cached input ${cached}%`} htmlFor="cache">
            <Slider id="cache" value={[cached]} min={0} max={100} onValueChange={(value) => setCached(value[0] ?? 0)} />
          </FieldRow>
          <div className="flex flex-wrap gap-1.5">
            {shown.map((model) => {
              const on = ids.includes(model.id);
              return (
                <ChipButton key={model.id} pressed={on} onClick={() => setIds(on ? ids.filter((id) => id !== model.id) : [...ids, model.id])}>
                  {model.label}
                </ChipButton>
              );
            })}
            {hidden > 0 ? <ChipButton onClick={() => setMore(true)}>+{hidden}</ChipButton> : null}
          </div>
        </Pane>
        <Pane label="Cost">
        <div aria-live="polite" className="flex flex-col gap-3">
          {text.trim() ? (
            <>
              {long ? <Notice tone="warn" title="A long-context rate applies to at least one model." /> : null}
              <ResultTable
                caption="Estimated model cost"
                columns={[
                  { key: "model", label: "Model" },
                  { key: "request", label: "Request" },
                  { key: "month", label: "Month", className: "max-[699px]:hidden" },
                ]}
                rows={rows.map((row) => ({
                  key: row.model.id,
                  cells: [
                    <div key="model">
                      <p className="font-medium">{row.model.label}</p>
                      <p className="text-xs text-muted-foreground">{row.model.tokenizer === "estimate" ? "estimate ≈ o200k · " : ""}{row.longContext ? "long-context rate · " : ""}{row.overContext ? "over context" : ""}</p>
                    </div>,
                    <span key="request" className="font-mono tabular-nums">{money(row.requestUsd)}</span>,
                    <span key="month" className="font-mono tabular-nums">{money(row.monthUsd)}</span>,
                  ],
                }))}
              />
              <p className="text-[12px] text-muted-foreground">Claude, Gemini, and other non-OpenAI counts are o200k estimates. Prices checked {PRICES_UPDATED}.</p>
            </>
          ) : (
            <EmptyState art={<Coins size={22} />} title="The table shows up here" hint={`Prices checked ${PRICES_UPDATED}. Paste a prompt to price it.`} />
          )}
        </div>
        </Pane>
      </ToolPanes>
      <StatusStrip note={status} tone="pass" trailing="⌘⇧C copy table · esc clear" />
    </ToolCard>
  );
}
