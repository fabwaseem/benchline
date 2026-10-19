import type { Metadata } from "next";
import { Suspense } from "react";
import { ExportLink } from "@/components/admin/export-link";
import { Failed, PageIntro, Panel } from "@/components/admin/panel";
import { RangePicker } from "@/components/admin/range-picker";
import { ToolsTable } from "@/components/admin/tools-table";
import { loadTools } from "@/lib/admin/load";
import { rangeFrom } from "@/lib/admin/page-range";
import { rangeLabel, rangeQuery } from "@/lib/admin/range";

export const metadata: Metadata = { title: "Tools", robots: { index: false, follow: false } };

export default async function ToolsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const range = await rangeFrom(searchParams);
  const loaded = await loadTools(range);
  const query = rangeQuery(range);
  return (
    <>
      <PageIntro title="Tools" lede={`${rangeLabel(range)}. Every registry tool is listed, including ones with no runs.`} action={<Suspense fallback={null}><RangePicker /></Suspense>} />
      {!loaded.ok ? <Failed error={loaded.error} /> : (
        <Panel title="Usage" action={<ExportLink href={`/api/admin/export?table=tools&${query}`} />}>
          <ToolsTable rows={loaded.data} query={query} />
        </Panel>
      )}
    </>
  );
}
