import { addDuration, emptyHistogram, retentionCutoff } from "@/lib/analytics/duration";
import {
  countRowsFromRuns,
  durationFromRuns,
  emptyReport,
  eventInRange,
  mergeCountries,
  runsInFilter,
  summarizeRuns,
} from "@/lib/analytics/stats";
import type { AnalyticsEvent, AnalyticsStore, StatsFilter, ToolRunEvent } from "@/lib/analytics/types";

type Rollup = {
  day: string;
  kind: "run" | "page" | "tool_open" | "search" | "action";
  slug: string;
  source: string;
  outcome: string;
  country: string;
  mcpClient: string;
  mcpVersion: string;
  action: string;
  deviceClass: string;
  events: number;
  hist: number[];
};

function dayOverlaps(day: string, filter: StatsFilter): boolean {
  const start = new Date(`${day}T00:00:00.000Z`).getTime();
  if (Number.isNaN(start)) return false;
  return start + 86_400_000 > filter.from.getTime() && start < filter.to.getTime();
}

function bump(rows: Rollup[], next: Omit<Rollup, "events" | "hist"> & { hist?: number[] }) {
  const found = rows.find(
    (row) =>
      row.day === next.day &&
      row.kind === next.kind &&
      row.slug === next.slug &&
      row.source === next.source &&
      row.outcome === next.outcome &&
      row.country === next.country &&
      row.mcpClient === next.mcpClient &&
      row.mcpVersion === next.mcpVersion &&
      row.action === next.action &&
      row.deviceClass === next.deviceClass,
  );
  if (found) {
    found.events += 1;
    if (next.hist) {
      next.hist.forEach((count, index) => {
        found.hist[index] = (found.hist[index] ?? 0) + count;
      });
    }
    return;
  }
  rows.push({ ...next, events: 1, hist: next.hist ?? emptyHistogram() });
}

export function createMemoryStore(): AnalyticsStore & { events(): AnalyticsEvent[] } {
  const events: AnalyticsEvent[] = [];
  const rollup: Rollup[] = [];

  function rawDay(kind: AnalyticsEvent["kind"], day: string) {
    return events.some((event) => event.kind === kind && event.ts.slice(0, 10) === day);
  }

  return {
    events() {
      return events;
    },
    async write(batch) {
      events.push(...batch);
    },
    async migrate() {},
    async retain(days, now = new Date()) {
      const cutoff = retentionCutoff(days, now).getTime();
      const kept: AnalyticsEvent[] = [];
      for (const event of events) {
        if (new Date(event.ts).getTime() >= cutoff) {
          kept.push(event);
          continue;
        }
        const day = event.ts.slice(0, 10);
        if (event.kind === "run") {
          const hist = emptyHistogram();
          addDuration(hist, event.durationMs);
          bump(rollup, {
            day,
            kind: "run",
            slug: event.slug,
            source: event.source,
            outcome: event.outcome,
            country: event.country ?? "",
            mcpClient: event.mcpClientName ?? "",
            mcpVersion: event.mcpClientVersion ?? "",
            action: "",
            deviceClass: "",
            hist,
          });
        } else if (event.kind === "page") {
          bump(rollup, {
            day,
            kind: "page",
            slug: event.path,
            source: "",
            outcome: "",
            country: event.country ?? "",
            mcpClient: "",
            mcpVersion: "",
            action: "",
            deviceClass: event.deviceClass ?? "",
          });
        } else if (event.kind === "tool_open") {
          bump(rollup, {
            day,
            kind: "tool_open",
            slug: event.slug,
            source: "",
            outcome: "",
            country: event.country ?? "",
            mcpClient: "",
            mcpVersion: "",
            action: "",
            deviceClass: event.deviceClass ?? "",
          });
        } else if (event.kind === "search") {
          bump(rollup, {
            day,
            kind: "search",
            slug: "",
            source: "",
            outcome: "",
            country: event.country ?? "",
            mcpClient: "",
            mcpVersion: "",
            action: "",
            deviceClass: "",
          });
        } else {
          bump(rollup, {
            day,
            kind: "action",
            slug: event.slug ?? "",
            source: "",
            outcome: "",
            country: event.country ?? "",
            mcpClient: "",
            mcpVersion: "",
            action: event.action,
            deviceClass: "",
          });
        }
      }
      events.length = 0;
      events.push(...kept);
    },
    async stats(filter) {
      const report = emptyReport(filter);
      const runs = events.filter((event): event is ToolRunEvent => event.kind === "run" && runsInFilter(event, filter));
      const rolledRuns = rollup.filter(
        (row) => row.kind === "run" && dayOverlaps(row.day, filter) && !rawDay("run", row.day) && (!filter.slug || row.slug === filter.slug) && (!filter.source || row.source === filter.source),
      );
      const rows = [
        ...countRowsFromRuns(runs),
        ...rolledRuns.map((row) => ({
          slug: row.slug,
          source: row.source,
          outcome: row.outcome,
          day: row.day,
          country: row.country,
          mcpClient: row.mcpClient,
          mcpVersion: row.mcpVersion,
          runs: row.events,
          errors: row.outcome === "error" ? row.events : 0,
        })),
      ];
      const rawDuration = durationFromRuns(runs);
      const histogram = rolledRuns.reduce((hist, row) => {
        row.hist.forEach((count, index) => {
          hist[index] = (hist[index] ?? 0) + count;
        });
        return hist;
      }, emptyHistogram());
      const summary = summarizeRuns(rows, rawDuration, rawDuration.samples > 0 ? null : histogram);
      const includeWeb = !filter.source || filter.source === "web";
      const pagePath = filter.slug ? `/t/${filter.slug}` : null;
      let views = 0;
      let toolOpens = 0;
      let searches = 0;
      let copies = 0;
      let downloads = 0;
      const countries: { country: string; runs: number }[] = [];
      if (includeWeb) {
        for (const event of events) {
          if (!eventInRange(event, filter)) continue;
          if (event.kind === "page" && (!pagePath || event.path === pagePath)) {
            views += 1;
            if (event.country) countries.push({ country: event.country, runs: 1 });
          }
          if (event.kind === "tool_open" && (!filter.slug || event.slug === filter.slug)) toolOpens += 1;
          if (event.kind === "search" && !filter.slug) searches += 1;
          if (event.kind === "action" && (!filter.slug || event.slug === filter.slug)) {
            if (event.action === "copy") copies += 1;
            if (event.action === "download") downloads += 1;
          }
        }
        for (const row of rollup) {
          if (!dayOverlaps(row.day, filter) || rawDay(row.kind, row.day)) continue;
          if (row.kind === "page" && (!pagePath || row.slug === pagePath)) {
            views += row.events;
            if (row.country) countries.push({ country: row.country, runs: row.events });
          }
          if (row.kind === "tool_open" && (!filter.slug || row.slug === filter.slug)) toolOpens += row.events;
          if (row.kind === "search" && !filter.slug) searches += row.events;
          if (row.kind === "action" && (!filter.slug || row.slug === filter.slug)) {
            if (row.action === "copy") copies += row.events;
            if (row.action === "download") downloads += row.events;
          }
        }
      }
      return {
        ...report,
        ...summary,
        topCountries: mergeCountries(summary.topCountries, countries),
        pages: { views, toolOpens, searches, copies, downloads },
      };
    },
  };
}
