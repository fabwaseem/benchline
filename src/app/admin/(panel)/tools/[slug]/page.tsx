import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { RunsChart } from "@/components/admin/charts";
import { KpiCard } from "@/components/admin/kpi";
import { Failed, PageIntro, Panel, ShareList, shareOf } from "@/components/admin/panel";
import { RangePicker } from "@/components/admin/range-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/kit/primitives/table";
import { EmptyState } from "@/components/kit/empty-state";
import { formatMs, formatNumber, formatPercent, formatWhen } from "@/lib/admin/format";
import { loadTool } from "@/lib/admin/load";
import { rangeFrom } from "@/lib/admin/page-range";
import { rangeLabel, rangeQuery } from "@/lib/admin/range";
import { getTool } from "@/registry";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  return { title: tool?.name ?? "Tool", robots: { index: false, follow: false } };
}

export default async function ToolDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();
  const range = await rangeFrom(searchParams);
  const loaded = await loadTool(slug, range);
  const query = rangeQuery(range);
  const data = loaded.ok ? loaded.data : null;
  const maxError = data ? Math.max(1, ...data.errors.map((row) => row.count)) : 1;
  const maxClient = data ? Math.max(1, ...data.clients.map((row) => row.runs)) : 1;
  const maxCountry = data ? Math.max(1, ...data.countries.map((row) => row.runs)) : 1;
  const maxSource = data ? Math.max(1, ...data.sources.map((row) => row.runs)) : 1;

  return (
    <>
      <PageIntro
        title={tool.name}
        lede={`${tool.tagline} ${rangeLabel(range)}.`}
        action={<Suspense fallback={null}><RangePicker /></Suspense>}
      />
      <p className="mb-4 font-mono text-[12px] text-faint">
        <Link href={`/admin/tools?${query}`} className="hover:text-foreground">Tools</Link>
        <span> / {tool.slug}</span>
      </p>
      {!loaded.ok || !data ? <Failed error={loaded.ok ? "failed" : loaded.error} /> : (
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Runs" value={data.tool.runs} display={formatNumber(data.tool.runs)} previous={range.compare ? data.tool.previousRuns : null} spark={data.series.map((point) => point.web + point.mcp + point.api)} compare={range.compare} />
            <KpiCard label="Users" value={data.tool.users} display={formatNumber(data.tool.users)} previous={null} spark={[]} compare={false} />
            <KpiCard label="Success" value={data.tool.success} display={formatPercent(data.tool.success)} previous={null} spark={[]} compare={false} />
            <KpiCard label="p50" value={data.tool.p50} display={formatMs(data.tool.p50)} previous={null} spark={[]} compare={false} lowerIsBetter />
            <KpiCard label="p95" value={data.tool.p95} display={formatMs(data.tool.p95)} previous={null} spark={[]} compare={false} lowerIsBetter />
            <KpiCard label="Opens → runs" value={data.tool.conversion} display={formatPercent(data.tool.conversion)} previous={null} spark={[]} compare={false} />
          </div>
          <Panel title="Runs by source">
            <RunsChart data={data.series} />
          </Panel>
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Error codes">
              <ShareList empty="No errors in this range." rows={data.errors.map((row) => ({ key: row.code, label: row.code === "rolled" ? "Rolled up" : row.code, value: formatNumber(row.count), share: shareOf(row.count, maxError) }))} />
            </Panel>
            <Panel title="Sources">
              <ShareList empty="No runs in this range." rows={data.sources.map((row) => ({ key: row.source, label: row.source, value: formatNumber(row.runs), share: shareOf(row.runs, maxSource) }))} />
            </Panel>
            <Panel title="MCP clients">
              <ShareList empty="No MCP calls for this tool." rows={data.clients.map((row) => ({ key: `${row.name}@${row.version}`, label: row.version ? `${row.name} ${row.version}` : row.name, value: formatNumber(row.runs), share: shareOf(row.runs, maxClient) }))} />
            </Panel>
            <Panel title="Countries">
              <ShareList empty="No country on these runs." rows={data.countries.map((row) => ({ key: row.country, label: row.name, value: formatNumber(row.runs), share: shareOf(row.runs, maxCountry) }))} />
            </Panel>
          </div>
          <Panel title="Recent runs">
            {data.recent.length === 0 ? <EmptyState title="No recent runs" hint="The last day of raw runs for this tool shows up here." /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Country</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recent.map((event) => (
                    <TableRow key={event.id || event.ts}>
                      <TableCell className="font-mono text-[12px]">{formatWhen(event.ts)} UTC</TableCell>
                      <TableCell className="font-mono text-[12px]">{event.source}</TableCell>
                      <TableCell className="font-mono text-[12px]">{event.outcome}{event.errorCode ? ` · ${event.errorCode}` : ""}</TableCell>
                      <TableCell className="font-mono tabular-nums">{formatMs(event.durationMs)}</TableCell>
                      <TableCell className="font-mono text-[12px]">{event.country ?? "—"}</TableCell>
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
