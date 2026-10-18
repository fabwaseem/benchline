"use client";

import { useEffect, useState } from "react";
import { Braces } from "lucide-react";
import { ChipButton, TextArea, TextInput } from "@/components/kit/controls";
import { CopyButton } from "@/components/kit/copy-button";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Pane, StatusStrip, ToolCard, ToolPanes } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { evaluateJsonPath, formatValue, type JsonPathEvaluation } from "@/tools/jsonpath-tester/lib/jsonpath";

const SAMPLE_JSON = `{
  "store": {
    "book": [
      { "category": "reference", "author": "Nigel Rees", "title": "Sayings of the Century", "price": 8.95 },
      { "category": "fiction", "author": "Evelyn Waugh", "title": "Sword of Honour", "price": 12.99 },
      { "category": "fiction", "author": "Herman Melville", "title": "Moby Dick", "price": 8.99 },
      { "category": "fiction", "author": "J. R. R. Tolkien", "title": "The Lord of the Rings", "price": 22.99 }
    ],
    "bicycle": { "color": "red", "price": 19.95 }
  }
}`;

const SAMPLE_QUERIES = [
  "$.store.book[*].author",
  "$.store.book[?(@.price < 10)].title",
  "$..price",
  "$.store.book[0:2]",
];

export default function JsonPathTesterTool() {
  const [jsonText, setJsonText] = useState(SAMPLE_JSON);
  const [query, setQuery] = useState("$.store.book[*].author");
  const [result, setResult] = useState<JsonPathEvaluation | null>(null);

  useEffect(() => {
    const kick = window.setTimeout(() => {
      setResult(evaluateJsonPath(jsonText, query));
    }, 150);
    return () => window.clearTimeout(kick);
  }, [jsonText, query]);

  const outputText =
    result && !("error" in result) ? result.matches.map((match) => formatValue(match.value)).join("\n") : "";

  useWorkbenchKeys({
    onCopy: () => {
      if (!outputText) return;
      void navigator.clipboard.writeText(outputText);
    },
  });

  const note =
    !result || "error" in result
      ? "Write a query to see matches"
      : `${result.count} match${result.count === 1 ? "" : "es"}${result.truncated ? " · truncated at 500" : ""}`;

  return (
    <ToolCard>
      <ToolPanes>
        <Pane label="Document & query">
          <FieldRow label="JSON document" htmlFor="jp-json">
            <TextArea
              id="jp-json"
              value={jsonText}
              onChange={(event) => setJsonText(event.target.value)}
              rows={14}
              spellCheck={false}
              className="font-mono text-[12.5px]"
            />
          </FieldRow>
          <FieldRow label="JSONPath query" htmlFor="jp-query">
            <TextInput
              id="jp-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              spellCheck={false}
              placeholder="$.store.book[*].author"
              className="font-mono"
            />
          </FieldRow>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_QUERIES.map((sample) => (
              <ChipButton key={sample} onClick={() => setQuery(sample)}>
                <span className="font-mono text-[12px]">{sample}</span>
              </ChipButton>
            ))}
          </div>
        </Pane>
        <Pane
          label="Matches"
          actions={outputText ? <CopyButton value={outputText} label="Copy values" /> : undefined}
        >
          {!result ? (
            <EmptyState art={<Braces size={22} />} title="Waiting" hint="Type a query to evaluate it against the document." />
          ) : "error" in result ? (
            <Notice tone="bad" role="alert" title="Query error" body={result.error} />
          ) : result.count === 0 ? (
            <EmptyState art={<Braces size={22} />} title="No matches" hint="The query is valid but matched nothing in this document." />
          ) : (
            <>
              {result.truncated ? (
                <Notice tone="warn" title="Large result set" body={`Showing the first 500 of ${result.count} matches.`} />
              ) : null}
              <ul className="flex flex-col gap-1.5">
                {result.matches.map((match, index) => (
                  <li key={`${match.path}-${index}`} className="rounded-lg border border-border bg-surface px-3 py-2">
                    <div className="truncate font-mono text-[11px] text-muted-foreground" title={match.path}>
                      {match.path}
                    </div>
                    <div className="mt-0.5 break-all font-mono text-[13px]">{formatValue(match.value)}</div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Pane>
      </ToolPanes>
      <StatusStrip note={note} tone={result && "error" in result ? "warn" : "pass"} />
    </ToolCard>
  );
}
