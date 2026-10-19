import type { Metadata } from "next";
import { Suspense } from "react";
import { KpiCard } from "@/components/admin/kpi";
import { ExportLink } from "@/components/admin/export-link";
import { Failed, PageIntro, Panel, ShareList, shareOf } from "@/components/admin/panel";
import { RangePicker } from "@/components/admin/range-picker";
import { CountChart } from "@/components/admin/charts";
import { formatNumber } from "@/lib/admin/format";
import { loadMcp } from "@/lib/admin/load";
import { rangeFrom } from "@/lib/admin/page-range";
import { rangeLabel, rangeQuery } from "@/lib/admin/range";
import { Notice } from "@/components/kit/notice";

export const metadata: Metadata = { title: "MCP", robots: { index: false, follow: false } };

export default async function McpPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const range = await rangeFrom(searchParams);
  const loaded = await loadMcp(range);
  const query = rangeQuery(range);
  const data = loaded.ok ? loaded.data : null;
  const maxClient = data ? Math.max(1, ...data.clients.map((row) => row.runs)) : 1;
  const maxProtocol = data ? Math.max(1, ...data.protocols.map((row) => row.runs)) : 1;
  const maxHost = data ? Math.max(1, ...data.hosts.map((row) => row.runs)) : 1;
  const maxMix = data ? Math.max(1, ...data.mix.map((row) => row.runs)) : 1;
  return (
    <>
      <PageIntro title="MCP" lede={`${rangeLabel(range)}. Sessions, clients, protocol, and which host the call used.`} action={<Suspense fallback={null}><RangePicker /></Suspense>} />
      {!loaded.ok || !data ? <Failed error={loaded.ok ? "failed" : loaded.error} /> : (
        <div className="flex flex-col gap-4">
          {data.rolled > 0 ? <Notice tone="neutral" title="Older MCP calls were rolled up without host or protocol." body={`${formatNumber(data.rolled)} calls in this range only have the daily total.`} /> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <KpiCard label="Sessions" value={data.sessions.value} display={formatNumber(data.sessions.value)} previous={data.sessions.previous} spark={data.sessions.spark} compare={range.compare} />
            <KpiCard label="Calls" value={data.calls.value} display={formatNumber(data.calls.value)} previous={data.calls.previous} spark={data.calls.spark} compare={range.compare} />
          </div>
          <Panel title="Calls over time">
            <CountChart data={data.series.map((point) => ({ bucket: point.bucket, count: point.runs }))} />
          </Panel>
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Host" action={<ExportLink href={`/api/admin/export?table=hosts&${query}`} />}>
              <ShareList empty="No MCP calls in this range." rows={data.hosts.map((row) => ({ key: row.host, label: row.host === "legacy" ? "tools.fabwaseem.com" : row.host === "benchline" ? "benchline.fabwaseem.com" : row.host, value: `${formatNumber(row.runs)} · ${formatNumber(row.sessions)} sessions`, share: shareOf(row.runs, maxHost) }))} />
            </Panel>
            <Panel title="Protocol" action={<ExportLink href={`/api/admin/export?table=protocols&${query}`} />}>
              <ShareList empty="Protocol is stored on raw MCP calls." rows={data.protocols.map((row) => ({ key: row.protocol, label: row.protocol, value: formatNumber(row.runs), share: shareOf(row.runs, maxProtocol) }))} />
            </Panel>
            <Panel title="Clients" action={<ExportLink href={`/api/admin/export?table=clients&${query}`} />}>
              <ShareList empty="Clients appear when a session sends a name." rows={data.clients.map((row) => ({ key: `${row.name}@${row.version}`, label: row.version ? `${row.name} ${row.version}` : row.name, value: formatNumber(row.runs), share: shareOf(row.runs, maxClient) }))} />
            </Panel>
            <Panel title="Tool mix">
              <ShareList empty="No MCP calls in this range." rows={data.mix.map((row) => ({ key: row.slug, label: row.name, value: formatNumber(row.runs), share: shareOf(row.runs, maxMix), href: `/admin/tools/${row.slug}?${query}` }))} />
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}
