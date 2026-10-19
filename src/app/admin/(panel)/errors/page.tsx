import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { CountChart, Sparkline } from "@/components/admin/charts";
import { ExportLink } from "@/components/admin/export-link";
import { Failed, PageIntro, Panel } from "@/components/admin/panel";
import { RangePicker } from "@/components/admin/range-picker";
import { EmptyState } from "@/components/kit/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/kit/primitives/table";
import { formatNumber } from "@/lib/admin/format";
import { loadErrors } from "@/lib/admin/load";
import { rangeFrom } from "@/lib/admin/page-range";
import { rangeLabel, rangeQuery } from "@/lib/admin/range";

export const metadata: Metadata = { title: "Errors", robots: { index: false, follow: false } };

export default async function ErrorsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const range = await rangeFrom(searchParams);
  const loaded = await loadErrors(range);
  const query = rangeQuery(range);
  return (
    <>
      <PageIntro title="Errors" lede={`${rangeLabel(range)}. Grouped by tool and error code. Rolled-up days keep the count without a code.`} action={<Suspense fallback={null}><RangePicker /></Suspense>} />
      {!loaded.ok ? <Failed error={loaded.error} /> : (
        <div className="flex flex-col gap-4">
          <Panel title="Errors over time">
            {loaded.data.series.length === 0 ? <EmptyState title="No errors in this range" hint="Failed runs will collect here." /> : <CountChart data={loaded.data.series} />}
          </Panel>
          <Panel title="By tool and code" action={<ExportLink href={`/api/admin/export?table=errors&${query}`} />}>
            {loaded.data.groups.length === 0 ? <EmptyState title="No grouped errors" hint="A clean range stays empty." /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tool</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loaded.data.groups.map((row) => (
                    <TableRow key={`${row.slug}-${row.code}`}>
                      <TableCell>
                        <Link href={`/admin/tools/${row.slug}?${query}`} className="font-medium hover:underline">{row.name}</Link>
                      </TableCell>
                      <TableCell className="font-mono text-[12px]">{row.code === "rolled" ? "rolled up" : row.code}</TableCell>
                      <TableCell className="font-mono tabular-nums">{formatNumber(row.count)}</TableCell>
                      <TableCell><Sparkline values={row.spark} tone="bad" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Panel>
        </div>
      )}
    </>
  );
}
