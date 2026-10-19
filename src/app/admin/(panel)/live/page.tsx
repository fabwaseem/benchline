import type { Metadata } from "next";
import { Suspense } from "react";
import { LiveBoard } from "@/components/admin/live-board";
import { ExportLink } from "@/components/admin/export-link";
import { Failed, PageIntro, Panel } from "@/components/admin/panel";
import { loadLive } from "@/lib/admin/load";
import { firstParam, liveFilters } from "@/lib/admin/range";

export const metadata: Metadata = { title: "Live", robots: { index: false, follow: false } };

export default async function LivePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters = liveFilters({
    source: firstParam(params.source),
    slug: firstParam(params.slug),
    outcome: firstParam(params.outcome),
  });
  const loaded = await loadLive(filters);
  const exportQuery = new URLSearchParams();
  if (filters.source) exportQuery.set("source", filters.source);
  if (filters.slug) exportQuery.set("slug", filters.slug);
  if (filters.outcome) exportQuery.set("outcome", filters.outcome);
  return (
    <>
      <PageIntro title="Live" lede="Tool runs from the last 24 hours. This view refreshes every few seconds." action={<ExportLink href={`/api/admin/export?table=live&${exportQuery.toString()}`} />} />
      {!loaded.ok ? <Failed error={loaded.error} /> : (
        <Panel title="Recent runs">
          <Suspense fallback={null}>
            <LiveBoard events={loaded.data} />
          </Suspense>
        </Panel>
      )}
    </>
  );
}
