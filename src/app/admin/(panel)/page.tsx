import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { RunsChart } from "@/components/admin/charts";
import { KpiCard } from "@/components/admin/kpi";
import { ExportLink } from "@/components/admin/export-link";
import { Failed, PageIntro, Panel, ShareList, shareOf } from "@/components/admin/panel";
import { RangePicker } from "@/components/admin/range-picker";
import { formatMs, formatNumber, formatPercent } from "@/lib/admin/format";
import { loadOverview } from "@/lib/admin/load";
import { rangeFrom } from "@/lib/admin/page-range";
import { rangeLabel, rangeQuery } from "@/lib/admin/range";
import { Notice } from "@/components/kit/notice";

export const metadata: Metadata = { title: "Overview", robots: { index: false, follow: false } };

export default async function OverviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const range = await rangeFrom(searchParams);
  const loaded = await loadOverview(range);
  const query = rangeQuery(range);
  const maxTool = loaded.ok ? Math.max(1, ...loaded.data.topTools.map((row) => row.runs)) : 1;
  const maxCountry = loaded.ok ? Math.max(1, ...loaded.data.countries.map((row) => row.runs)) : 1;
  const maxSource = loaded.ok ? Math.max(1, ...loaded.data.bySource.map((row) => row.runs)) : 1;
  const maxOutcome = loaded.ok ? Math.max(1, ...loaded.data.byOutcome.map((row) => row.runs)) : 1;
  const maxClient = loaded.ok ? Math.max(1, ...loaded.data.clients.map((row) => row.runs)) : 1;
  const maxReferrer = loaded.ok ? Math.max(1, ...loaded.data.referrers.map((row) => row.views)) : 1;
  const maxUtm = loaded.ok ? Math.max(1, ...loaded.data.utms.map((row) => row.views)) : 1;
  const maxDevice = loaded.ok ? Math.max(1, ...loaded.data.devices.map((row) => row.views)) : 1;
  const maxSearch = loaded.ok ? Math.max(1, ...loaded.data.searches.map((row) => row.count)) : 1;
  const maxError = loaded.ok ? Math.max(1, ...loaded.data.errorRates.map((row) => row.rate)) : 1;

  return (
    <>
      <PageIntro title="Overview" lede={rangeLabel(range)} action={<Suspense fallback={null}><RangePicker /></Suspense>} />
      {!loaded.ok ? <Failed error={loaded.error} /> : null}
      {loaded.ok ? (
        <div className="flex flex-col gap-4">
          {loaded.data.durationSource === "histogram" ? (
            <Notice tone="neutral" title="Latency for this range uses the duration histogram." body="Shorter ranges use exact percentiles from raw timings." />
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Runs" value={loaded.data.runs.value} display={formatNumber(loaded.data.runs.value)} previous={loaded.data.runs.previous} spark={loaded.data.runs.spark} compare={range.compare} />
            <KpiCard label="Visitors" value={loaded.data.visitors.value} display={formatNumber(loaded.data.visitors.value)} previous={loaded.data.visitors.previous} spark={loaded.data.visitors.spark} compare={range.compare} />
            <KpiCard label="Success" value={loaded.data.success.value} display={formatPercent(loaded.data.success.value)} previous={loaded.data.success.previous} spark={loaded.data.success.spark} compare={range.compare} />
            <KpiCard label="p50" value={loaded.data.p50.value} display={formatMs(loaded.data.p50.value)} previous={loaded.data.p50.previous} spark={loaded.data.p50.spark} compare={range.compare} lowerIsBetter />
            <KpiCard label="p95" value={loaded.data.p95.value} display={formatMs(loaded.data.p95.value)} previous={loaded.data.p95.previous} spark={loaded.data.p95.spark} compare={range.compare} lowerIsBetter />
            <KpiCard label="MCP sessions" value={loaded.data.mcpSessions.value} display={formatNumber(loaded.data.mcpSessions.value)} previous={loaded.data.mcpSessions.previous} spark={loaded.data.mcpSessions.spark} compare={range.compare} />
            <KpiCard label="Page views" value={loaded.data.pageViews.value} display={formatNumber(loaded.data.pageViews.value)} previous={loaded.data.pageViews.previous} spark={loaded.data.pageViews.spark} compare={range.compare} />
          </div>
          <Panel
            title="Runs by source"
            action={
              <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                <span><i className="mr-1 inline-block size-2 rounded-full bg-chart-1" />Web</span>
                <span><i className="mr-1 inline-block size-2 rounded-full bg-chart-3" />MCP</span>
                <span><i className="mr-1 inline-block size-2 rounded-full bg-chart-2" />API</span>
              </div>
            }
          >
            <RunsChart data={loaded.data.series} />
          </Panel>
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Top tools" action={<Link href={`/admin/tools?${query}`} className="text-[12px] text-muted-foreground hover:text-foreground">All tools</Link>}>
              <ShareList
                empty="Runs show up here after a tool is used."
                rows={loaded.data.topTools.map((row) => ({
                  key: row.slug,
                  label: row.name,
                  value: formatNumber(row.runs),
                  share: shareOf(row.runs, maxTool),
                  href: `/admin/tools/${row.slug}?${query}`,
                }))}
              />
            </Panel>
            <Panel title="Source" action={<ExportLink href={`/api/admin/export?table=sources&${query}`} />}>
              <ShareList empty="No runs in this range." rows={loaded.data.bySource.map((row) => ({ key: row.source, label: row.source, value: formatNumber(row.runs), share: shareOf(row.runs, maxSource) }))} />
            </Panel>
            <Panel title="Outcome">
              <ShareList empty="No runs in this range." rows={loaded.data.byOutcome.map((row) => ({ key: row.outcome, label: row.outcome, value: formatNumber(row.runs), share: shareOf(row.runs, maxOutcome) }))} />
            </Panel>
            <Panel title="Countries" action={<ExportLink href={`/api/admin/export?table=countries&${query}`} />}>
              <ShareList empty="Country is empty until a lookup succeeds." rows={loaded.data.countries.map((row) => ({ key: row.country, label: row.name, value: formatNumber(row.runs), share: shareOf(row.runs, maxCountry) }))} />
            </Panel>
            <Panel title="MCP clients" action={<ExportLink href={`/api/admin/export?table=clients&${query}`} />}>
              <ShareList
                empty="MCP calls name the client when the session sends one."
                rows={loaded.data.clients.map((row) => ({
                  key: `${row.name}@${row.version}`,
                  label: row.version ? `${row.name} ${row.version}` : row.name,
                  value: formatNumber(row.runs),
                  share: shareOf(row.runs, maxClient),
                }))}
              />
            </Panel>
            <Panel title="Referrers" action={<ExportLink href={`/api/admin/export?table=referrers&${query}`} />}>
              <ShareList empty="Referrers are kept on raw page views." rows={loaded.data.referrers.map((row) => ({ key: row.host, label: row.host, value: formatNumber(row.views), share: shareOf(row.views, maxReferrer) }))} />
            </Panel>
            <Panel title="Campaigns" action={<ExportLink href={`/api/admin/export?table=utms&${query}`} />}>
              <ShareList
                empty="UTM tags show up when a visit arrives with them."
                rows={loaded.data.utms.map((row) => ({
                  key: `${row.source}|${row.medium}|${row.campaign}`,
                  label: [row.source, row.medium, row.campaign].filter(Boolean).join(" · ") || "untagged",
                  value: formatNumber(row.views),
                  share: shareOf(row.views, maxUtm),
                }))}
              />
            </Panel>
            <Panel title="Devices" action={<ExportLink href={`/api/admin/export?table=devices&${query}`} />}>
              <ShareList empty="Device class comes from page views." rows={loaded.data.devices.map((row) => ({ key: row.device, label: row.device, value: formatNumber(row.views), share: shareOf(row.views, maxDevice) }))} />
            </Panel>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Searches" action={<ExportLink href={`/api/admin/export?table=searches&${query}`} />}>
              {loaded.data.rolledSearches > 0 ? <p className="mb-3 text-[12px] text-muted-foreground">Older searches were rolled up without the query text ({formatNumber(loaded.data.rolledSearches)}).</p> : null}
              <ShareList
                empty="Directory searches appear after someone types a query."
                rows={loaded.data.searches.map((row) => ({
                  key: row.query,
                  label: row.zero ? `${row.query} · no match` : row.query,
                  value: formatNumber(row.count),
                  share: shareOf(row.count, maxSearch),
                }))}
              />
            </Panel>
            <Panel title="Error rate by tool" action={<Link href={`/admin/errors?${query}`} className="text-[12px] text-muted-foreground hover:text-foreground">Errors</Link>}>
              <ShareList
                empty="No failed runs in this range."
                rows={loaded.data.errorRates.filter((row) => row.errors > 0).map((row) => ({
                  key: row.slug,
                  label: row.name,
                  value: `${formatPercent(row.rate)} · ${formatNumber(row.errors)}`,
                  share: shareOf(row.rate, maxError),
                  href: `/admin/tools/${row.slug}?${query}`,
                }))}
              />
            </Panel>
          </div>
        </div>
      ) : null}
    </>
  );
}
