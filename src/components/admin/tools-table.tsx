"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/kit/primitives/input";
import { Button } from "@/components/kit/primitives/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/kit/primitives/table";
import { EmptyState } from "@/components/kit/empty-state";
import { Sparkline } from "@/components/admin/charts";
import { formatDelta, formatMs, formatNumber, formatPercent } from "@/lib/admin/format";
import { percentDelta, type ToolRow } from "@/lib/admin/shape";

const columns = [
  { key: "name", label: "Tool" },
  { key: "runs", label: "Runs" },
  { key: "users", label: "Users" },
  { key: "success", label: "Success" },
  { key: "p50", label: "p50" },
  { key: "p95", label: "p95" },
  { key: "sources", label: "Sources" },
  { key: "conversion", label: "Opens → runs" },
  { key: "trend", label: "Trend" },
] as const;

type SortKey = (typeof columns)[number]["key"];

function trendOf(row: ToolRow): number | null {
  return percentDelta(row.runs, row.previousRuns);
}

function valueOf(row: ToolRow, key: SortKey): number | string {
  if (key === "trend") return trendOf(row) ?? (row.runs > 0 ? Number.POSITIVE_INFINITY : 0);
  if (key === "sources") return row.web + row.mcp + row.api;
  if (key === "p50" || key === "p95" || key === "conversion") return row[key] ?? -1;
  return row[key];
}

export function ToolsTable({ rows, query }: { rows: ToolRow[]; query: string }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("runs");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const list = needle ? rows.filter((row) => `${row.name} ${row.slug}`.toLowerCase().includes(needle)) : rows;
    return [...list].sort((a, b) => {
      const left = valueOf(a, sort);
      const right = valueOf(b, sort);
      const cmp = typeof left === "string" && typeof right === "string" ? left.localeCompare(right) : Number(left) - Number(right);
      return dir === "asc" ? cmp : -cmp;
    });
  }, [dir, rows, search, sort]);

  function toggle(key: SortKey) {
    if (sort === key) setDir((current) => (current === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir(key === "name" ? "asc" : "desc");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tools" aria-label="Search tools" />
      {filtered.length === 0 ? (
        <EmptyState title="No tool matches" hint="Try another name or slug." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>
                  <Button type="button" variant="ghost" size="sm" className="px-1" onClick={() => toggle(column.key)} aria-sort={sort === column.key ? (dir === "asc" ? "ascending" : "descending") : "none"}>
                    {column.label}
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => {
              const trend = trendOf(row);
              return (
                <TableRow key={row.slug}>
                  <TableCell>
                    <Link href={`/admin/tools/${row.slug}?${query}`} className="font-medium hover:underline">
                      {row.name}
                    </Link>
                    <div className="font-mono text-[11px] text-faint">{row.slug}</div>
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">{formatNumber(row.runs)}</TableCell>
                  <TableCell className="font-mono tabular-nums">{formatNumber(row.users)}</TableCell>
                  <TableCell className="font-mono tabular-nums">{row.runs ? formatPercent(row.success) : "—"}</TableCell>
                  <TableCell className="font-mono tabular-nums">{formatMs(row.p50)}</TableCell>
                  <TableCell className="font-mono tabular-nums">{formatMs(row.p95)}</TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground tabular-nums">
                    {row.web} web · {row.mcp} mcp · {row.api} api
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">{formatPercent(row.conversion)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Sparkline values={row.spark} />
                      <span className="font-mono text-[12px] tabular-nums">{row.previousRuns === 0 && row.runs === 0 ? "—" : formatDelta(trend)}</span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
