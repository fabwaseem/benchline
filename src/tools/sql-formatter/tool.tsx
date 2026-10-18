"use client";

import { useMemo, useState } from "react";
import { Database } from "lucide-react";
import { CodeField, CodeOutput } from "@/components/kit/code-output";
import { Select } from "@/components/kit/controls";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Segmented } from "@/components/kit/segmented";
import { Pane, StatusStrip, ToolCard, ToolPanes } from "@/components/kit/shell";
import { dialectLabels, dialects, exampleSql, formatSql, type Dialect, type KeywordStyle, type SqlIndent } from "@/tools/sql-formatter/lib/sql";

export default function SqlFormatterTool() {
  const [sql, setSql] = useState(exampleSql);
  const [dialect, setDialect] = useState<Dialect>("postgresql");
  const [keywordCase, setKeywordCase] = useState<KeywordStyle>("upper");
  const [indent, setIndent] = useState<SqlIndent>(2);
  const result = useMemo(() => formatSql(sql, dialect, keywordCase, indent), [dialect, indent, keywordCase, sql]);
  const failed = "error" in result;

  return (
    <ToolCard>
      <ToolPanes>
        <Pane label="SQL" scroll={false} bodyClassName="flex min-h-[320px] flex-col gap-3 p-3">
          <CodeField id="sql-input" label="SQL query" value={sql} invalid={failed} onChange={(event) => setSql(event.target.value)} className="min-h-0 flex-1" />
          <FieldRow label="Dialect" htmlFor="sql-dialect">
            <Select id="sql-dialect" value={dialect} onChange={(event) => setDialect(event.target.value as Dialect)}>
              {dialects.map((item) => <option key={item} value={item}>{dialectLabels[item]}</option>)}
            </Select>
          </FieldRow>
          <Segmented label="Keywords" value={keywordCase} onChange={setKeywordCase} options={[{ value: "upper", label: "Upper" }, { value: "lower", label: "Lower" }, { value: "preserve", label: "Keep" }]} />
          <Segmented label="Indent" value={String(indent)} onChange={(value) => setIndent(value === "4" ? 4 : 2)} options={[{ value: "2", label: "2 spaces" }, { value: "4", label: "4 spaces" }]} />
        </Pane>
        <Pane label="Formatted" padded={false} scroll={false}>
          <div aria-live="polite" className="flex min-h-[320px] flex-col gap-3 p-3">
            {failed ? (
              <>
                <Notice tone="bad" role="alert" title={result.error} />
                <EmptyState art={<Database size={22} />} title="Nothing to format" hint="Check the query, or clear it to start again." />
              </>
            ) : result.sql ? (
              <CodeOutput code={result.sql} filename="query.sql" label="SQL" fill className="min-h-0 flex-1" />
            ) : (
              <EmptyState art={<Database size={22} />} title="No query yet" hint="Paste a statement to format it." />
            )}
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip note={failed ? result.error : `${dialectLabels[dialect]} · ${keywordCase} keywords`} tone={failed ? "fail" : "pass"} />
    </ToolCard>
  );
}
