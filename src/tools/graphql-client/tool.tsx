"use client";

import { useState } from "react";
import { Waypoints } from "lucide-react";
import { toast } from "sonner";
import { CodeField, CodeOutput } from "@/components/kit/code-output";
import { ActionButton, TextButton, TextInput } from "@/components/kit/controls";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { ErrorCallout } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import {
  exampleEndpoint,
  exampleQuery,
  exampleVariables,
  executeGraphql,
  pushHistory,
  type GraphqlHeader,
  type GraphqlResult,
  type HistoryEntry,
} from "@/tools/graphql-client/lib/graphql";

const HISTORY_KEY = "benchline:graphql-client:history";

function loadHistory(): HistoryEntry[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function GraphqlClientTool() {
  const [endpoint, setEndpoint] = useState(exampleEndpoint);
  const [query, setQuery] = useState(exampleQuery);
  const [variables, setVariables] = useState(exampleVariables);
  const [headers, setHeaders] = useState<GraphqlHeader[]>([{ name: "Authorization", value: "" }]);
  const [result, setResult] = useState<GraphqlResult | null>(null);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);

  const send = () => {
    setSending(true);
    setResult(null);
    const activeHeaders = headers.filter((h) => h.name.trim() && h.value.trim());
    void executeGraphql({ endpoint, query, variablesText: variables, headers: activeHeaders })
      .then((r) => {
        setResult(r);
        if (r.ok || r.status !== 0) {
          setHistory((prev) => {
            const next = pushHistory(prev, endpoint.trim(), query);
            try {
              window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
            } catch {
              /* storage unavailable */
            }
            return next;
          });
        }
        if (!r.ok) toast.error(r.error ?? "Request failed");
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "The request failed.";
        setResult({ ok: false, status: 0, durationMs: 0, error: message });
        toast.error(message);
      })
      .finally(() => setSending(false));
  };

  const responseText = result ? JSON.stringify(result.data ?? result.errors ?? { error: result.error }, null, 2) : "";

  const updateHeader = (index: number, patch: Partial<GraphqlHeader>) => {
    setHeaders((prev) => prev.map((h, i) => (i === index ? { ...h, ...patch } : h)));
  };

  const status = sending ? "Sending…" : result ? `${result.ok ? "OK" : "Failed"} · HTTP ${result.status} · ${result.durationMs} ms` : "Write a query and press Send.";

  return (
    <ToolCard>
      <ToolToolbar
        label="Request"
        options={[{ value: "query", label: "Query" }]}
        value="query"
        onChange={() => undefined}
        actions={
          <>
            <ActionButton variant="outline" onClick={() => { setEndpoint(exampleEndpoint); setQuery(exampleQuery); setVariables(exampleVariables); }}>
              Sample
            </ActionButton>
            <ActionButton
              className="btn btn-ink"
              disabled={sending || !endpoint.trim() || !query.trim()}
              onClick={send}
            >
              {sending ? "Sending…" : "Send"}
            </ActionButton>
          </>
        }
      />
      <ToolPanes>
        <Pane label="Request" scroll bodyClassName="flex min-h-[340px] flex-col gap-3 p-3">
          <FieldRow label="Endpoint" htmlFor="gql-endpoint" help="Local, private, and internal addresses are blocked.">
            <TextInput
              id="gql-endpoint"
              value={endpoint}
              onChange={(event) => setEndpoint(event.target.value)}
              className="font-mono"
              placeholder="https://example.com/graphql"
              spellCheck={false}
            />
          </FieldRow>
          <CodeField id="gql-query" label="Query" value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-[180px]" />
          <CodeField id="gql-vars" label="Variables (JSON)" value={variables} onChange={(event) => setVariables(event.target.value)} className="min-h-[96px]" />
          <FieldRow label="Headers">
            <div className="flex flex-col gap-2">
              {headers.map((header, index) => (
                <div key={index} className="flex gap-2">
                  <TextInput
                    aria-label="Header name"
                    value={header.name}
                    onChange={(event) => updateHeader(index, { name: event.target.value })}
                    placeholder="Name"
                    className="font-mono"
                  />
                  <TextInput
                    aria-label="Header value"
                    value={header.value}
                    onChange={(event) => updateHeader(index, { value: event.target.value })}
                    placeholder="Value"
                    className="font-mono"
                  />
                  <ActionButton variant="ghost" onClick={() => setHeaders((prev) => prev.filter((_, i) => i !== index))}>
                    Remove
                  </ActionButton>
                </div>
              ))}
              <ActionButton variant="outline" onClick={() => setHeaders((prev) => [...prev, { name: "", value: "" }])}>
                Add header
              </ActionButton>
            </div>
          </FieldRow>
          {history.length > 0 ? (
            <FieldRow label="History">
              <ul className="flex flex-col gap-1">
                {history.map((entry) => (
                  <li key={entry.id}>
                    <TextButton
                      className="w-full truncate text-left font-mono text-[12px] text-muted-foreground hover:text-foreground"
                      title={`${entry.endpoint}\n${entry.query}`}
                      onClick={() => {
                        setEndpoint(entry.endpoint);
                        setQuery(entry.query);
                      }}
                    >
                      {entry.endpoint}
                    </TextButton>
                  </li>
                ))}
              </ul>
            </FieldRow>
          ) : null}
        </Pane>
        <Pane label="Response" scroll={false} bodyClassName="flex min-h-[340px] flex-col gap-3 p-3">
          {!result ? (
            <EmptyState art={<Waypoints size={22} />} title="No response yet" hint="Send the query to see the response here." />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <ResultStat label="Status" value={result.ok ? `OK · ${result.status}` : `Fail · ${result.status}`} />
                <ResultStat label="Duration" value={`${result.durationMs} ms`} />
                <ResultStat label="Size" value={`${new TextEncoder().encode(responseText).length.toLocaleString("en-US")} B`} />
              </div>
              {result.error && !result.ok && result.status === 0 ? <ErrorCallout title="Request failed" body={result.error} /> : null}
              <CodeOutput code={responseText} filename="response.json" label="Response" fill className="min-h-0 flex-1" />
            </>
          )}
        </Pane>
      </ToolPanes>
      <StatusStrip note={status} tone={result && !result.ok ? "fail" : "pass"} trailing="enter to send" />
    </ToolCard>
  );
}
