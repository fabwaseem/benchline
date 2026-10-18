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
    <div className={cn("overflow-hidden rounded-lg border border-border bg-background", className)}>
      <div className="flex items-center gap-2 border-b border-border px-2 py-1.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="ml-auto flex gap-1">
          <CopyButton value={code} />
          {filename ? <DownloadButton filename={filename} content={code} /> : null}
        </div>
      </div>
      <div className="max-h-96 overflow-auto" tabIndex={0} aria-label={label}>
        <div className="min-w-full font-mono text-xs leading-5">
          {lines.map((line, index) => (
            <div key={`${index}-${line.slice(0, 12)}`} className="flex">
              <span className="sticky left-0 w-10 shrink-0 bg-background pr-2 text-right text-muted-foreground tabular-nums">
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
