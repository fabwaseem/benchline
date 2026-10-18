"use client";

import { useEffect, useMemo, useState } from "react";
import { Shrink } from "lucide-react";
import { toast } from "sonner";
import { CodeField, CodeOutput } from "@/components/kit/code-output";
import { ActionButton, OptionRow, Select } from "@/components/kit/controls";
import { DownloadButton } from "@/components/kit/download-button";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { ErrorCallout } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import {
  exampleCss,
  exampleHtml,
  exampleJs,
  LANGUAGE_LABELS,
  LANGUAGES,
  minifyCode,
  type Language,
  type MinifyResult,
} from "@/tools/code-minifier/lib/minify";

const EXAMPLES: Record<Language, string> = { js: exampleJs, css: exampleCss, html: exampleHtml };
const FILENAMES: Record<Language, string> = { js: "minified.js", css: "minified.css", html: "minified.html" };

function formatBytes(n: number): string {
  return `${n.toLocaleString("en-US")} B`;
}

export default function CodeMinifierTool() {
  const [language, setLanguage] = useState<Language>("js");
  const [inputs, setInputs] = useState<Record<Language, string>>(EXAMPLES);
  const [jsMangle, setJsMangle] = useState(true);
  const [jsCompress, setJsCompress] = useState(true);
  const [cssLevel, setCssLevel] = useState<"1" | "2">("2");
  const [htmlAggressive, setHtmlAggressive] = useState(false);
  const [result, setResult] = useState<MinifyResult | null>(null);
  const [working, setWorking] = useState(false);

  const input = inputs[language] ?? "";

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setWorking(true);
      void minifyCode(language, input, {
        jsMangle,
        jsCompress,
        cssLevel: Number(cssLevel) as 1 | 2,
        htmlAggressive,
      }).then((r) => {
        if (!cancelled) {
          setResult(r);
          setWorking(false);
        }
      });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [language, input, jsMangle, jsCompress, cssLevel, htmlAggressive]);

  const code = result && !result.error ? result.code : "";

  useWorkbenchKeys({
    onCopy: () => {
      if (!code) return;
      void navigator.clipboard.writeText(code).then(() => toast.success("Minified code copied"));
    },
    onEscape: () => setInputs((prev) => ({ ...prev, [language]: EXAMPLES[language] ?? "" })),
  });

  const status = useMemo(() => {
    if (working) return "Minifying…";
    if (!result) return "Type or paste code to minify.";
    if (result.error) return `Error — ${result.error}`;
    return `${formatBytes(result.beforeBytes)} → ${formatBytes(result.afterBytes)} · saved ${formatBytes(result.savedBytes)} (${result.savedPct}%)`;
  }, [working, result]);

  return (
    <ToolCard>
      <ToolToolbar
        label="Language"
        options={LANGUAGES.map((l) => ({ value: l, label: LANGUAGE_LABELS[l] }))}
        value={language}
        onChange={(value) => setLanguage(value as Language)}
        actions={
          <>
            <ActionButton variant="outline" onClick={() => setInputs((prev) => ({ ...prev, [language]: EXAMPLES[language] ?? "" }))}>Sample</ActionButton>
            <ActionButton variant="ghost" onClick={() => setInputs((prev) => ({ ...prev, [language]: "" }))}>Clear</ActionButton>
            <ActionButton
              className="btn btn-ink"
              disabled={!code}
              onClick={() => void navigator.clipboard.writeText(code).then(() => toast.success("Minified code copied"))}
            >
              Copy
            </ActionButton>
            <DownloadButton filename={FILENAMES[language]} content={code} label="Download" disabled={!code} />
          </>
        }
      />
      <ToolPanes>
        <Pane label="Source" scroll={false} bodyClassName="flex min-h-[340px] flex-col gap-3 p-3">
          <CodeField
            id="code-input"
            label={`${LANGUAGE_LABELS[language]} source`}
            value={input}
            invalid={Boolean(result?.error)}
            onChange={(event) => setInputs((prev) => ({ ...prev, [language]: event.target.value }))}
            className="min-h-0 flex-1"
          />
          {language === "js" ? (
            <>
              <OptionRow label="Mangle names" checked={jsMangle} onChange={setJsMangle} hint="Shorten local variable and function names." />
              <OptionRow label="Compress" checked={jsCompress} onChange={setJsCompress} hint="Apply Terser's compression passes." />
            </>
          ) : null}
          {language === "css" ? (
            <FieldRow label="Optimization level" htmlFor="css-level">
              <Select id="css-level" value={cssLevel} onChange={(event) => setCssLevel(event.target.value as "1" | "2")}>
                <option value="1">Level 1 — safe</option>
                <option value="2">Level 2 — aggressive</option>
              </Select>
            </FieldRow>
          ) : null}
          {language === "html" ? (
            <OptionRow
              label="Aggressive mode"
              checked={htmlAggressive}
              onChange={setHtmlAggressive}
              hint="Also remove optional tags and minify URLs."
            />
          ) : null}
        </Pane>
        <Pane label="Minified" scroll={false} bodyClassName="flex min-h-[340px] flex-col gap-3 p-3">
          {result?.error ? (
            <>
              <ErrorCallout title="Minification failed" body={result.error} />
              <EmptyState art={<Shrink size={22} />} title="Nothing minified" hint="Fix the reported error in the source." />
            </>
          ) : result ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                <ResultStat label="Before" value={formatBytes(result.beforeBytes)} />
                <ResultStat label="After" value={formatBytes(result.afterBytes)} />
                <ResultStat label="Saved" value={`${formatBytes(result.savedBytes)} (${result.savedPct}%)`} />
              </div>
              <CodeOutput code={result.code} filename={FILENAMES[language]} label="Minified" fill className="min-h-0 flex-1" />
            </>
          ) : (
            <EmptyState art={<Shrink size={22} />} title="Nothing yet" hint="Paste some code on the left." />
          )}
        </Pane>
      </ToolPanes>
      <StatusStrip note={status} tone={result?.error ? "fail" : "pass"} trailing="⌘⇧C copy · esc reset" />
    </ToolCard>
  );
}
