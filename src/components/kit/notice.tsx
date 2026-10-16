import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-well text-fg2 shadow-[inset_0_0_0_1px_var(--border)] dark:bg-sunken",
  ok: "bg-[color-mix(in_srgb,var(--success)_6%,var(--surface))] text-fg2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--success)_40%,transparent)] dark:bg-[color-mix(in_srgb,var(--success)_8%,var(--surface))]",
  warn: "bg-[color-mix(in_srgb,var(--warning)_7%,var(--surface))] text-fg2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--warning)_45%,transparent)] dark:bg-[color-mix(in_srgb,var(--warning)_9%,var(--surface))]",
  bad: "bg-[color-mix(in_srgb,var(--danger)_6%,var(--surface))] text-fg2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--danger)_40%,transparent)] dark:bg-[color-mix(in_srgb,var(--danger)_9%,var(--surface))]",
};

const iconTones = {
  neutral: "text-muted-foreground",
  ok: "text-status-ok",
  warn: "text-status-warn",
  bad: "text-status-bad",
};

export function Notice({
  tone = "neutral",
  icon,
  title,
  body,
  role,
  className,
}: {
  tone?: "neutral" | "ok" | "warn" | "bad";
  icon?: ReactNode;
  title: string;
  body?: string;
  role?: "alert" | "status";
  className?: string;
}) {
  return (
    <div role={role} className={cn("notice flex gap-2.5 rounded-[11px] px-3.5 py-[11px] text-[12.5px] leading-normal", tones[tone], className)}>
      {icon ? <span className={cn("mt-0.5 shrink-0", iconTones[tone])}>{icon}</span> : null}
      <div>
        <b className="font-semibold text-foreground">{title}</b>
        {body ? <div className="mt-px text-muted-foreground">{body}</div> : null}
      </div>
    </div>
  );
}
