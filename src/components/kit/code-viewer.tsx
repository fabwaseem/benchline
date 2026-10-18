"use client";

import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type FocusEvent } from "react";
import { highlightCode, languageFor, shouldHighlight, type HighlightLine } from "@/components/kit/code-highlight";
import { CopyButton } from "@/components/kit/copy-button";
import { DownloadButton } from "@/components/kit/download-button";
import { cn } from "@/lib/utils";

export type CodeDiffRow = {
  kind: "same" | "add" | "remove" | "change";
  left: string;
  right: string;
  leftNumber: number | null;
  rightNumber: number | null;
};

export type CodeDiffPiece = {
  type: "same" | "add" | "remove";
  value: string;
};

type DiffModel =
  | { view: "split"; rows: CodeDiffRow[] }
  | { view: "inline"; pieces: CodeDiffPiece[] };

export function CodeViewer({
  code = "",
  filename,
  label = "Output",
  language,
  className,
  highlightLines,
  maxHeight = 384,
  wrapDefault = false,
  dense = false,
  diff,
  fill = false,
  chrome = true,
}: {
  code?: string;
  filename?: string;
  label?: string;
  language?: string;
  className?: string;
  highlightLines?: number[];
  maxHeight?: number;
  wrapDefault?: boolean;
  dense?: boolean;
  diff?: DiffModel;
  fill?: boolean;
  chrome?: boolean;
}) {
  const [wrap, setWrap] = useState(wrapDefault);
  const lang = languageFor(filename, label, language);
  const text = diff ? diffText(diff) : code;
  const highlighted = useHighlighted(diff ? "" : code, lang);
  const marked = new Set(highlightLines ?? []);
  const lines = code.length > 0 ? code.split("\n") : [""];
  return (
    <div className={cn("flex min-h-0 min-w-0 flex-col overflow-hidden bg-well", chrome && "rounded-lg border border-border", fill && "h-full min-h-[280px]", className)}>
      {chrome ? (
        <div className="flex items-center gap-2 border-b border-border px-2 py-1.5">
          <span className="truncate font-mono text-[11px] tracking-[0.06em] text-muted-foreground uppercase">{label}</span>
          <span className="font-mono text-[11px] text-faint">{lang}</span>
          <div className="ml-auto flex gap-1">
            <button type="button" className="btn h-7 px-2 text-[12px]" aria-pressed={wrap} onClick={() => setWrap((value) => !value)}>
              Wrap
            </button>
            <CopyButton value={text} />
            {filename ? <DownloadButton filename={filename} content={text} /> : null}
          </div>
        </div>
      ) : null}
      <div className={cn("min-h-0 overflow-auto", fill && "flex-1")} style={fill ? undefined : { maxHeight }} tabIndex={0} aria-label={label}>
        {diff?.view === "split" ? <SplitDiff rows={diff.rows} wrap={wrap} /> : null}
        {diff?.view === "inline" ? <InlineDiff pieces={diff.pieces} wrap={wrap} /> : null}
        {diff ? null : (
          <div className={cn("min-w-full font-mono text-[12.5px] leading-6", dense && "text-[12px] leading-5")}>
            {lines.map((line, index) => (
              <div key={index} className={cn("flex", marked.has(index + 1) && "bg-[color-mix(in_srgb,var(--accent-brand)_16%,transparent)]")}>
                <span className="sticky left-0 w-10 shrink-0 bg-well pr-2 text-right text-faint tabular-nums select-none">{index + 1}</span>
                <span className={cn("min-w-0 flex-1 pr-3", wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre")}>
                  <LineBody line={line} tokens={highlighted.lines?.[index]} plain={highlighted.plain} />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CodeEditor({
  id,
  value,
  onChange,
  onBlur,
  invalid = false,
  label = "Code",
  filename,
  language,
  className,
  spellCheck = false,
  highlightLines,
  maxHeight = 384,
  fill = false,
  "aria-describedby": describedBy,
  "aria-invalid": ariaInvalid,
}: {
  id?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (event: FocusEvent<HTMLTextAreaElement>) => void;
  invalid?: boolean;
  label?: string;
  filename?: string;
  language?: string;
  className?: string;
  spellCheck?: boolean;
  highlightLines?: number[];
  maxHeight?: number;
  fill?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}) {
  const [wrap, setWrap] = useState(false);
  const [scroll, setScroll] = useState({ top: 0, left: 0 });
  const gutter = useRef<HTMLDivElement>(null);
  const lang = languageFor(filename, label, language);
  const highlighted = useHighlighted(value, lang);
  const lines = value.length > 0 ? value.split("\n") : [""];
  const marked = new Set(highlightLines ?? []);
  const hidden = Boolean(highlighted.lines) && !highlighted.plain;
  return (
    <div className={cn("flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-well", fill && "h-full", (invalid || ariaInvalid) && "border-destructive", className)}>
      <div className="flex items-center gap-2 border-b border-border px-2 py-1.5">
        <span className="font-mono text-[11px] tracking-[0.06em] text-muted-foreground uppercase">{label}</span>
        <span className="font-mono text-[11px] text-faint">{lang}</span>
        <div className="ml-auto flex gap-1">
          <button type="button" className="btn h-7 px-2 text-[12px]" aria-pressed={wrap} onClick={() => setWrap((current) => !current)}>
            Wrap
          </button>
          <CopyButton value={value} />
          {filename ? <DownloadButton filename={filename} content={value} /> : null}
        </div>
      </div>
      <div className={cn("flex min-h-48 overflow-hidden", fill && "min-h-0 flex-1")} style={fill ? undefined : { maxHeight }}>
        <div ref={gutter} aria-hidden className="w-10 shrink-0 overflow-hidden bg-well py-2 text-right font-mono text-[12.5px] leading-6 text-faint select-none">
          {lines.map((_, index) => (
            <div key={index} className={cn("pr-2", marked.has(index + 1) && "bg-[color-mix(in_srgb,var(--accent-brand)_16%,transparent)]")}>{index + 1}</div>
          ))}
        </div>
        <div className="relative min-h-48 min-w-0 flex-1 overflow-hidden">
          <pre
            aria-hidden
            className={cn("pointer-events-none absolute top-0 left-0 m-0 min-w-full px-3 py-2 font-mono text-[12.5px] leading-6", wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre")}
            style={{ transform: `translate(${-scroll.left}px, ${-scroll.top}px)` }}
          >
            {lines.map((line, index) => (
              <div key={index} className={marked.has(index + 1) ? "bg-[color-mix(in_srgb,var(--accent-brand)_16%,transparent)]" : undefined}>
                <LineBody line={line} tokens={highlighted.lines?.[index]} plain={highlighted.plain} />
              </div>
            ))}
          </pre>
          <textarea
            id={id}
            value={value}
            spellCheck={spellCheck}
            aria-invalid={invalid || ariaInvalid || undefined}
            aria-label={label}
            aria-describedby={describedBy}
            wrap={wrap ? "soft" : "off"}
            onChange={onChange}
            onBlur={onBlur}
            onScroll={(event) => {
              const top = event.currentTarget.scrollTop;
              const left = event.currentTarget.scrollLeft;
              setScroll({ top, left });
              if (gutter.current) gutter.current.scrollTop = top;
            }}
            className={cn(
              "absolute inset-0 h-full w-full resize-none bg-transparent px-3 py-2 font-mono text-[12.5px] leading-6 outline-none",
              hidden ? "text-transparent caret-foreground" : "text-foreground",
              wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre",
            )}
          />
        </div>
      </div>
    </div>
  );
}

function LineBody({ line, tokens, plain }: { line: string; tokens?: HighlightLine; plain: boolean }) {
  if (plain || !tokens) return <>{line || " "}</>;
  if (tokens.length === 0) return <> </>;
  return (
    <>
      {tokens.map((token, index) => (
        <TokenSpan key={`${index}-${token.offset}`} token={token} />
      ))}
    </>
  );
}

function TokenSpan({ token }: { token: HighlightLine[number] }) {
  const style = token.variants.light?.fontStyle ?? 0;
  return (
    <span
      className="shiki-token"
      style={{
        "--shiki-light": token.variants.light?.color,
        "--shiki-dark": token.variants.dark?.color,
        fontStyle: style & 1 ? "italic" : undefined,
        fontWeight: style & 2 ? 700 : undefined,
      } as CSSProperties}
    >
      {token.content}
    </span>
  );
}

function SplitDiff({ rows, wrap }: { rows: CodeDiffRow[]; wrap: boolean }) {
  if (rows.length === 0) return <p className="p-3 text-sm text-muted-foreground">Nothing to compare.</p>;
  return (
    <div className="min-w-full font-mono text-[12.5px] leading-6">
      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-2">
          <DiffCell side="left" kind={row.kind} number={row.leftNumber} text={row.left} wrap={wrap} />
          <DiffCell side="right" kind={row.kind} number={row.rightNumber} text={row.right} wrap={wrap} />
        </div>
      ))}
    </div>
  );
}

function DiffCell({ side, kind, number, text, wrap }: { side: "left" | "right"; kind: CodeDiffRow["kind"]; number: number | null; text: string; wrap: boolean }) {
  const marked = (kind === "remove" && side === "left") || (kind === "add" && side === "right") || (kind === "change" && text !== "");
  const tone = side === "left" ? "bg-[color-mix(in_srgb,var(--danger)_14%,transparent)]" : "bg-[color-mix(in_srgb,var(--success)_16%,transparent)]";
  return (
    <div className={marked ? `flex ${tone}` : "flex"}>
      <span className="w-8 shrink-0 pr-2 text-right text-faint tabular-nums">{number ?? ""}</span>
      <span className={cn("min-w-0 flex-1 pr-2", wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre")}>{text || " "}</span>
    </div>
  );
}

function InlineDiff({ pieces, wrap }: { pieces: CodeDiffPiece[]; wrap: boolean }) {
  if (pieces.length === 0) return <p className="p-3 text-sm text-muted-foreground">Nothing to compare.</p>;
  return (
    <div className={cn("p-3 font-mono text-[12.5px] leading-6", wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre")}>
      {pieces.map((piece, index) => (
        <span key={index} className={pieceClass(piece.type)}>{piece.value}</span>
      ))}
    </div>
  );
}

function pieceClass(type: CodeDiffPiece["type"]) {
  if (type === "add") return "bg-[color-mix(in_srgb,var(--success)_28%,transparent)]";
  if (type === "remove") return "bg-[color-mix(in_srgb,var(--danger)_24%,transparent)]";
  return "";
}

function diffText(diff: DiffModel) {
  if (diff.view === "inline") return diff.pieces.map((piece) => piece.value).join("");
  return diff.rows.map((row) => `${row.left}\t${row.right}`).join("\n");
}

function useHighlighted(code: string, language: string) {
  const plain = !code || !shouldHighlight(code);
  const [result, setResult] = useState<{ key: string; lines: HighlightLine[] | null } | null>(null);
  const key = `${language}\0${code}`;
  useEffect(() => {
    if (plain) return;
    let cancel = false;
    void highlightCode(code, language).then((next) => {
      if (!cancel) setResult({ key, lines: next });
    }).catch(() => {
      if (!cancel) setResult({ key, lines: null });
    });
    return () => {
      cancel = true;
    };
  }, [code, key, language, plain]);
  return { lines: plain || result?.key !== key ? null : result.lines, plain };
}
