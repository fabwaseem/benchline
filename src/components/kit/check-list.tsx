import { cn } from "@/lib/utils";

export type CheckLevel = "pass" | "warn" | "fail" | "info";

const tone: Record<CheckLevel, string> = {
  pass: "text-cat-seo",
  warn: "text-amber-foreground",
  fail: "text-destructive",
  info: "text-muted-foreground",
};

const label: Record<CheckLevel, string> = {
  pass: "Pass",
  warn: "Warn",
  fail: "Fail",
  info: "Note",
};

export function CheckList({
  rows,
}: {
  rows: { level: CheckLevel; label: string; detail: string }[];
}) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border" aria-live="polite">
      {rows.map((row) => (
        <li key={`${row.level}-${row.label}`} className="grid gap-1 bg-background px-3 py-2 sm:grid-cols-[4.5rem_1fr]">
          <span className={cn("text-xs font-medium tracking-tight", tone[row.level])}>{label[row.level]}</span>
          <div>
            <p className="text-sm font-medium tracking-tight">{row.label}</p>
            <p className="text-xs text-muted-foreground">{row.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
