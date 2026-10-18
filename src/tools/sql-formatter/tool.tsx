"use client";

import { useMemo, useState } from "react";
import { Database } from "lucide-react";
import { CodeOutput } from "@/components/kit/code-output";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Segmented } from "@/components/kit/segmented";
import { Panel, ToolShell } from "@/components/kit/tool-shell";
import { Textarea } from "@/components/ui/textarea";
import { dialectLabels, dialects, exampleSql, formatSql, type Dialect, type KeywordStyle, type SqlIndent } from "@/tools/sql-formatter/lib/sql";

const selectClass = "h-11 w-full rounded-lg border border-input bg-transparent px-2 text-sm min-[700px]:h-8";

export default function SqlFormatterTool() {
  const [sql, setSql] = useState(exampleSql);
  const [dialect, setDialect] = useState<Dialect>("postgresql");
  const [keywordCase, setKeywordCase] = useState<KeywordStyle>("upper");
  const [indent, setIndent] = useState<SqlIndent>(2);
  const result = useMemo(() => formatSql(sql, dialect, keywordCase, indent), [dialect, indent, keywordCase, sql]);
  const failed = "error" in result;

  return (
    <ToolShell
      runsLocally
      layout="split"
      status={
        <>
          <span className={failed ? "dot dot-warn" : "dot"} />
          <span>{failed ? result.error : `${dialectLabels[dialect]} · ${keywordCase} keywords`}</span>
        </>
      }
      input={
        <Panel title="SQL">
          <FieldRow label="Query" htmlFor="sql-input" error={failed ? result.error : undefined}>
            <Textarea id="sql-input" value={sql} onChange={(event) => setSql(event.target.value)} spellCheck={false} className="min-h-56 font-mono text-[13px]" aria-invalid={failed} />
          </FieldRow>
          <FieldRow label="Dialect" htmlFor="sql-dialect">
            <select id="sql-dialect" value={dialect} onChange={(event) => setDialect(event.target.value as Dialect)} className={selectClass}>
              {dialects.map((item) => <option key={item} value={item}>{dialectLabels[item]}</option>)}
            </select>
          </FieldRow>
          <Segmented label="Keywords" value={keywordCase} onChange={setKeywordCase} options={[{ value: "upper", label: "Upper" }, { value: "lower", label: "Lower" }, { value: "preserve", label: "Keep" }]} />
          <Segmented label="Indent" value={String(indent)} onChange={(value) => setIndent(value === "4" ? 4 : 2)} options={[{ value: "2", label: "2 spaces" }, { value: "4", label: "4 spaces" }]} />
        </Panel>
      }
      output={
        <div aria-live="polite" className="min-h-[240px]">
          {failed ? (
            <Panel>
              <Notice tone="bad" role="alert" title={result.error} />
              <EmptyState art={<Database size={22} />} title="Nothing to format" hint="Check the query, or clear it to start again." />
            </Panel>
          ) : result.sql ? (
            <Panel title="Formatted">
              <CodeOutput code={result.sql} filename="query.sql" label="SQL" />
            </Panel>
          ) : (
            <Panel>
              <EmptyState art={<Database size={22} />} title="No query yet" hint="Paste a statement to format it." />
            </Panel>
          )}
        </div>
      }
    />
  );
}
