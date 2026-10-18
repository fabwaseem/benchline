import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ResultTable({
  caption,
  columns,
  rows,
}: {
  caption?: string;
  columns: { key: string; label: string; className?: string }[];
  rows: { key: string; cells: ReactNode[] }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="font-mono text-[11px] tracking-[0.06em] text-muted-foreground uppercase">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={cn("py-2 pr-2 font-medium", column.className)}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-border">
              {row.cells.map((cell, index) => (
                <td key={columns[index]?.key ?? index} className={cn("py-2 pr-2 align-top", columns[index]?.className)}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
