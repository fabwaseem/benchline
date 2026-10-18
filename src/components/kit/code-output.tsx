"use client";

import { useRef, type ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/kit/copy-button";
import { DownloadButton } from "@/components/kit/download-button";

export function CodePanel(props: {
  code: string;
  filename?: string;
  label?: string;
  className?: string;
}) {
  return <CodeOutput {...props} />;
}

export function CodeEditor(props: {
  code: string;
  filename?: string;
  label?: string;
  className?: string;
}) {
  return <CodeOutput {...props} />;
}

export function CodeOutput({
  code,
  filename,
  label = "Output",
  className,
}: {
  code: string;
  filename?: string;
  label?: string;
  className?: string;
}) {
  const lines = code.length > 0 ? code.split("\n") : [""];
  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-surface", className)}>
      <div className="flex items-center gap-2 border-b border-border px-2 py-1.5">
        <span className="font-mono text-[11px] tracking-[0.06em] text-muted-foreground uppercase">{label}</span>
        <div className="ml-auto flex gap-1">
          <CopyButton value={code} />
          {filename ? <DownloadButton filename={filename} content={code} /> : null}
        </div>
      </div>
      <div className="max-h-96 overflow-auto" tabIndex={0} aria-label={label}>
        <div className="min-w-full font-mono text-xs leading-5">
          {lines.map((line, index) => (
            <div key={`${index}-${line.slice(0, 12)}`} className="flex">
              <span className="sticky left-0 w-10 shrink-0 bg-well pr-2 text-right text-faint tabular-nums">
                {index + 1}
              </span>
              <span className="pr-3 whitespace-pre">{line || " "}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CodeField({
  id,
  value,
  onChange,
  invalid = false,
  label,
  className,
  spellCheck = false,
}: {
  id?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  invalid?: boolean;
  label?: string;
  className?: string;
  spellCheck?: boolean;
}) {
  const gutter = useRef<HTMLDivElement>(null);
  const lines = value.length > 0 ? value.split("\n") : [""];
  return (
    <div className={cn("flex max-h-[32rem] overflow-hidden rounded-lg border border-border bg-surface", invalid && "border-destructive", className)}>
      <div ref={gutter} aria-hidden className="w-10 shrink-0 overflow-hidden bg-well py-2 text-right font-mono text-[12.5px] leading-6 text-faint select-none">
        {lines.map((_, index) => (
          <div key={index} className="pr-2">{index + 1}</div>
        ))}
      </div>
      <textarea
        id={id}
        value={value}
        spellCheck={spellCheck}
        aria-invalid={invalid || undefined}
        aria-label={label}
        onChange={onChange}
        onScroll={(event) => {
          if (gutter.current) gutter.current.scrollTop = event.currentTarget.scrollTop;
        }}
        className="min-h-72 flex-1 resize-y overflow-auto bg-transparent px-3 py-2 font-mono text-[12.5px] leading-6 text-foreground outline-none"
      />
    </div>
  );
}
