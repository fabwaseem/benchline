"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export type ResultLevel = "pass" | "warn" | "fail" | "info";

const ORDER: Record<ResultLevel, number> = { fail: 0, warn: 1, info: 2, pass: 3 };

const badge: Record<ResultLevel, string> = {
  fail: "bg-status-bad/10 text-status-bad",
  warn: "bg-status-warn/15 text-status-warn",
  pass: "bg-status-ok/10 text-status-ok",
  info: "bg-muted text-muted-foreground",
};

const word: Record<ResultLevel, string> = {
  fail: "Fail",
  warn: "Warn",
  pass: "Pass",
  info: "Info",
};

export type ResultRow = { level: ResultLevel; label: string; detail: string };

const filters = ["all", "fail", "warn", "pass"] as const;
type Filter = (typeof filters)[number];

export function ResultsTable({ rows, empty = "Nothing to show yet." }: { rows: ResultRow[]; empty?: string }) {
  const [filter, setFilter] = useState<Filter>("all");
  const ordered = useMemo(() => [...rows].sort((a, b) => ORDER[a.level] - ORDER[b.level] || a.label.localeCompare(b.label)), [rows]);
  const counts = {
    all: ordered.length,
    fail: ordered.filter((row) => row.level === "fail").length,
    warn: ordered.filter((row) => row.level === "warn").length,
    pass: ordered.filter((row) => row.level === "pass").length,
  };
  const shown = filter === "all" ? ordered : ordered.filter((row) => row.level === filter);

  return (
    <div className="flex min-h-0 flex-col">
      <div role="tablist" aria-label="Filter results" className="flex h-10 shrink-0 items-center gap-1 overflow-hidden border-b border-border px-2">
        {filters.map((item) => {
          const selected = filter === item;
          const label = item === "all" ? "All" : word[item];
          return (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={selected}
              className={cn(
                "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-[4px] px-2 text-[12.5px] font-medium whitespace-nowrap",
                selected ? "bg-sunken text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setFilter(item)}
            >
              {label}
              <span className="font-mono text-[11px] text-faint tabular-nums">{counts[item]}</span>
            </button>
          );
        })}
      </div>
      {shown.length === 0 ? (
        <p className="px-3 py-6 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="min-h-0 flex-1 overflow-auto">
          {shown.map((row) => (
            <li key={`${row.level}-${row.label}`} className="flex items-center gap-3 border-b border-border px-3 py-2 text-[13px] last:border-b-0">
              <span className={cn("inline-flex h-5 w-12 shrink-0 items-center justify-center rounded-[4px] text-[11px] font-medium whitespace-nowrap", badge[row.level])}>
                {word[row.level]}
              </span>
              <span className="w-36 shrink-0 truncate font-medium whitespace-nowrap min-[700px]:w-44" title={row.label}>
                {row.label}
              </span>
              <span className="min-w-0 flex-1 truncate whitespace-nowrap text-muted-foreground" title={row.detail}>
                {row.detail}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
