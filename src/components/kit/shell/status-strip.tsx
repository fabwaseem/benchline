import { AlertTriangle, Check, Info, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StripLevel = "pass" | "warn" | "fail" | "info";

const icon = {
  pass: Check,
  warn: AlertTriangle,
  fail: X,
  info: Info,
};

const tone: Record<StripLevel, string> = {
  pass: "text-status-ok",
  warn: "text-status-warn",
  fail: "text-status-bad",
  info: "text-muted-foreground",
};

export function StatusStrip({
  items,
  note,
  tone: noteTone = "info",
  trailing,
  children,
  className,
}: {
  items?: { level: StripLevel; label: string; detail?: string }[];
  note?: ReactNode;
  tone?: StripLevel;
  trailing?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-10 flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-3 py-2 text-[13px]", className)}>
      {note ? (
        <span className={cn("inline-flex min-w-0 items-center gap-2 whitespace-nowrap", tone[noteTone])}>
          <span className={cn("dot", noteTone === "warn" || noteTone === "fail" ? "dot-warn" : undefined)} />
          <span className="max-w-[48rem] truncate text-muted-foreground" title={typeof note === "string" ? note : undefined}>
            {note}
          </span>
        </span>
      ) : null}
      {items?.map((item) => {
        const Icon = icon[item.level];
        const tip = item.detail ? `${item.label}. ${item.detail}` : item.label;
        return (
          <span key={`${item.level}-${item.label}`} className="inline-flex max-w-full min-w-0 items-center gap-1.5 whitespace-nowrap" title={tip}>
            <Icon size={14} strokeWidth={1.75} className={cn("shrink-0", tone[item.level])} aria-hidden />
            <span className="font-medium">{item.label}</span>
            {item.detail ? <span className="max-w-[16rem] truncate text-muted-foreground">{item.detail}</span> : null}
          </span>
        );
      })}
      {children}
      {trailing ? <span className="ml-auto hidden text-[12px] text-faint min-[700px]:inline">{trailing}</span> : null}
    </div>
  );
}
