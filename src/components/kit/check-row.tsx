import { AlertTriangle, Check, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckLevel = "pass" | "warn" | "fail" | "info";

const tone: Record<CheckLevel, string> = {
  pass: "text-status-ok",
  warn: "text-status-warn",
  fail: "text-status-bad",
  info: "text-muted-foreground",
};

const word: Record<CheckLevel, string> = {
  pass: "Pass",
  warn: "Warn",
  fail: "Fail",
  info: "Info",
};

const icon = {
  pass: Check,
  warn: AlertTriangle,
  fail: X,
  info: Info,
};

export function CheckRow({
  level,
  label,
  detail,
}: {
  level: CheckLevel;
  label: string;
  detail: string;
}) {
  const Icon = icon[level];
  return (
    <li className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0">
      <span className={cn("inline-flex w-[4.5rem] shrink-0 items-center gap-1.5 pt-0.5 text-[12px] font-medium", tone[level])}>
        <Icon size={14} strokeWidth={1.75} aria-hidden />
        {word[level]}
      </span>
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium tracking-tight">{label}</p>
        <p className="text-[12.5px] text-muted-foreground">{detail}</p>
      </div>
    </li>
  );
}

export function CheckRows({
  rows,
}: {
  rows: { level: CheckLevel; label: string; detail: string }[];
}) {
  return (
    <ul aria-live="polite">
      {rows.map((row) => (
        <CheckRow key={`${row.level}-${row.label}`} level={row.level} label={row.label} detail={row.detail} />
      ))}
    </ul>
  );
}
