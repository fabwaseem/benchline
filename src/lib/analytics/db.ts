import postgres from "postgres";
import { applyMigrations, type MigrationDriver } from "@/lib/analytics/migrate";
import { emptyHistogram, retentionCutoff, retentionDays } from "@/lib/analytics/duration";
import { BOOTSTRAP_SQL, MIGRATIONS } from "@/lib/analytics/sql";
import { emptyReport, mergeCountries, summarizeRuns, type CountRow, type DurationSummary } from "@/lib/analytics/stats";
import { safeError, utcDay } from "@/lib/analytics/clean";
import type { AnalyticsEvent, AnalyticsStore, StatsFilter } from "@/lib/analytics/types";

type Sql = ReturnType<typeof postgres>;

function num(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return 0;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function rowsOf(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object");
}

function histOf(value: unknown): number[] {
  const hist = emptyHistogram();
  if (!Array.isArray(value)) return hist;
  value.forEach((item, index) => {
    if (index < hist.length) hist[index] = num(item);
  });
  return hist;
}

export function openDatabase(url: string): Sql {
  return postgres(url, {
    max: 4,
    idle_timeout: 20,
    connect_timeout: 5,
    onnotice: () => undefined,
  });
}

function driver(sql: Sql): MigrationDriver {
  return {
    async bootstrap() {
      await sql.unsafe(BOOTSTRAP_SQL);
    },
    async locked(run) {
      await sql.begin(async (tx) => {
        await tx.unsafe("select pg_advisory_xact_lock(814263001)");
        await run({
          async applied() {
            const value: unknown = await tx`select version from schema_migrations`;
            return rowsOf(value).map((row) => str(row.version)).filter(Boolean);
          },
          async apply(migration) {
            for (const statement of migration.statements) await tx.unsafe(statement);
            await tx`insert into schema_migrations (version) values (${migration.version})`;
          },
        });
      });
    },
  };
}

async function insertEvents(sql: Sql, events: AnalyticsEvent[]) {
  if (events.length === 0) return;
  await sql.begin(async (tx) => {
    for (const event of events) {
      const day = utcDay(new Date(event.ts));
      const ts = new Date(event.ts);
      if (event.kind === "run") {
        await tx`
          insert into tool_runs (
            ts, slug, source, outcome, error_code, duration_ms, input_bytes, output_bytes,
            ip_hash, country, ua_family, referrer_host, visitor_id, session_id,
            mcp_session_id, mcp_client_name, mcp_client_version, mcp_protocol, mcp_host, day
          ) values (
            ${ts}, ${event.slug}, ${event.source}, ${event.outcome}, ${event.errorCode},
            ${event.durationMs}, ${event.inputBytes}, ${event.outputBytes},
            ${event.ipHash}, ${event.country}, ${event.uaFamily}, ${event.referrerHost},
            ${event.visitorId}, ${event.sessionId}, ${event.mcpSessionId}, ${event.mcpClientName},
            ${event.mcpClientVersion}, ${event.mcpProtocol}, ${event.mcpHost}, ${day}
          )
        `;
      } else if (event.kind === "page") {
        await tx`
          insert into page_views (
            ts, path, referrer_host, utm_source, utm_medium, utm_campaign, utm_term, utm_content,
            device_class, ip_hash, country, ua_family, visitor_id, session_id, day
          ) values (
            ${ts}, ${event.path}, ${event.referrerHost}, ${event.utmSource}, ${event.utmMedium},
            ${event.utmCampaign}, ${event.utmTerm}, ${event.utmContent}, ${event.deviceClass},
            ${event.ipHash}, ${event.country}, ${event.uaFamily}, ${event.visitorId}, ${event.sessionId}, ${day}
          )
        `;
      } else if (event.kind === "tool_open") {
        await tx`
          insert into tool_opens (
            ts, slug, referrer_host, device_class, ip_hash, country, ua_family, visitor_id, session_id, day
          ) values (
            ${ts}, ${event.slug}, ${event.referrerHost}, ${event.deviceClass}, ${event.ipHash},
            ${event.country}, ${event.uaFamily}, ${event.visitorId}, ${event.sessionId}, ${day}
          )
        `;
      } else if (event.kind === "search") {
        await tx`
          insert into search_queries (ts, query, ip_hash, country, ua_family, visitor_id, session_id, day)
          values (${ts}, ${event.query}, ${event.ipHash}, ${event.country}, ${event.uaFamily}, ${event.visitorId}, ${event.sessionId}, ${day})
        `;
      } else {
        await tx`
          insert into ui_actions (ts, action, slug, ip_hash, country, ua_family, visitor_id, session_id, day)
          values (${ts}, ${event.action}, ${event.slug}, ${event.ipHash}, ${event.country}, ${event.uaFamily}, ${event.visitorId}, ${event.sessionId}, ${day})
        `;
      }
    }
  });
}

function countRow(row: Record<string, unknown>): CountRow {
  return {
    slug: str(row.slug),
    source: str(row.source),
    outcome: str(row.outcome),
    day: str(row.day).slice(0, 10),
    country: str(row.country),
    mcpClient: str(row.mcp_client),
    mcpVersion: str(row.mcp_version),
    runs: num(row.runs),
    errors: num(row.errors),
  };
}

const HISTOGRAM_SQL = `array[
  (count(*) filter (where duration_ms is not null and duration_ms <= 10))::int,
  (count(*) filter (where duration_ms > 10 and duration_ms <= 25))::int,
  (count(*) filter (where duration_ms > 25 and duration_ms <= 50))::int,
  (count(*) filter (where duration_ms > 50 and duration_ms <= 100))::int,
  (count(*) filter (where duration_ms > 100 and duration_ms <= 250))::int,
  (count(*) filter (where duration_ms > 250 and duration_ms <= 500))::int,
  (count(*) filter (where duration_ms > 500 and duration_ms <= 1000))::int,
  (count(*) filter (where duration_ms > 1000 and duration_ms <= 2500))::int,
  (count(*) filter (where duration_ms > 2500 and duration_ms <= 5000))::int,
  (count(*) filter (where duration_ms > 5000 and duration_ms <= 10000))::int,
  (count(*) filter (where duration_ms > 10000))::int
]::integer[]`;

export function createPostgresStore(sql: Sql): AnalyticsStore {
  return {
    async migrate() {
      await applyMigrations(driver(sql), MIGRATIONS);
    },
    async write(events) {
      await insertEvents(sql, events);
    },
    async retain(days = retentionDays(), now = new Date()) {
      const cutoff = retentionCutoff(days, now);
      const cutoffDay = utcDay(cutoff);
      await sql.begin(async (tx) => {
        await tx.unsafe("select pg_advisory_xact_lock(814263002)");
        await tx`
          delete from analytics_daily d
          where d.kind = 'run' and d.day < ${cutoffDay}::date
            and exists (select 1 from tool_runs r where r.day = d.day)
        `;
        await tx.unsafe(
          `insert into analytics_daily (
            day, kind, slug, source, outcome, country, mcp_client, mcp_version, action, device_class,
            events, error_events, duration_count, duration_sum_ms, duration_hist
          )
          select day, 'run', slug, source, outcome, coalesce(country, ''), coalesce(mcp_client_name, ''),
            coalesce(mcp_client_version, ''), '', '',
            count(*)::bigint,
            count(*) filter (where outcome = 'error')::bigint,
            count(duration_ms)::bigint,
            coalesce(sum(duration_ms), 0)::bigint,
            ${HISTOGRAM_SQL}
          from tool_runs
          where day < $1::date
          group by day, slug, source, outcome, coalesce(country, ''), coalesce(mcp_client_name, ''), coalesce(mcp_client_version, '')`,
          [cutoffDay],
        );
        await tx`delete from tool_runs where ts < ${cutoff}`;
        await tx`
          delete from analytics_daily d
          where d.kind = 'page' and d.day < ${cutoffDay}::date
            and exists (select 1 from page_views r where r.day = d.day)
        `;
        await tx`
          insert into analytics_daily (
            day, kind, slug, source, outcome, country, mcp_client, mcp_version, action, device_class,
            events, error_events, duration_count, duration_sum_ms, duration_hist
          )
          select day, 'page', path, '', '', coalesce(country, ''), '', '', '', coalesce(device_class, ''),
            count(*)::bigint, 0, 0, 0, ARRAY[0,0,0,0,0,0,0,0,0,0,0]::integer[]
          from page_views
          where day < ${cutoffDay}::date
          group by day, path, coalesce(country, ''), coalesce(device_class, '')
        `;
        await tx`delete from page_views where ts < ${cutoff}`;
        await tx`
          delete from analytics_daily d
          where d.kind = 'tool_open' and d.day < ${cutoffDay}::date
            and exists (select 1 from tool_opens r where r.day = d.day)
        `;
        await tx`
          insert into analytics_daily (
            day, kind, slug, source, outcome, country, mcp_client, mcp_version, action, device_class,
            events, error_events, duration_count, duration_sum_ms, duration_hist
          )
          select day, 'tool_open', slug, '', '', coalesce(country, ''), '', '', '', coalesce(device_class, ''),
            count(*)::bigint, 0, 0, 0, ARRAY[0,0,0,0,0,0,0,0,0,0,0]::integer[]
          from tool_opens
          where day < ${cutoffDay}::date
          group by day, slug, coalesce(country, ''), coalesce(device_class, '')
        `;
        await tx`delete from tool_opens where ts < ${cutoff}`;
        await tx`
          delete from analytics_daily d
          where d.kind = 'search' and d.day < ${cutoffDay}::date
            and exists (select 1 from search_queries r where r.day = d.day)
        `;
        await tx`
          insert into analytics_daily (
            day, kind, slug, source, outcome, country, mcp_client, mcp_version, action, device_class,
            events, error_events, duration_count, duration_sum_ms, duration_hist
          )
          select day, 'search', '', '', '', coalesce(country, ''), '', '', '', '',
            count(*)::bigint, 0, 0, 0, ARRAY[0,0,0,0,0,0,0,0,0,0,0]::integer[]
          from search_queries
          where day < ${cutoffDay}::date
          group by day, coalesce(country, '')
        `;
        await tx`delete from search_queries where ts < ${cutoff}`;
        await tx`
          delete from analytics_daily d
          where d.kind = 'action' and d.day < ${cutoffDay}::date
            and exists (select 1 from ui_actions r where r.day = d.day)
        `;
        await tx`
          insert into analytics_daily (
            day, kind, slug, source, outcome, country, mcp_client, mcp_version, action, device_class,
            events, error_events, duration_count, duration_sum_ms, duration_hist
          )
          select day, 'action', coalesce(slug, ''), '', '', coalesce(country, ''), '', '', action, '',
            count(*)::bigint, 0, 0, 0, ARRAY[0,0,0,0,0,0,0,0,0,0,0]::integer[]
          from ui_actions
          where day < ${cutoffDay}::date
          group by day, coalesce(slug, ''), action, coalesce(country, '')
        `;
        await tx`delete from ui_actions where ts < ${cutoff}`;
      });
    },
    async stats(filter) {
      const fromDay = utcDay(filter.from);
      const lastDay = utcDay(new Date(filter.to.getTime() - 1));
      try {
        return await sql.begin(async (tx) => {
          const rawValue: unknown = await tx`
            select slug, source, outcome, to_char(day, 'YYYY-MM-DD') as day,
              coalesce(country, '') as country,
              coalesce(mcp_client_name, '') as mcp_client,
              coalesce(mcp_client_version, '') as mcp_version,
              count(*)::int as runs,
              count(*) filter (where outcome = 'error')::int as errors
            from tool_runs
            where ts >= ${filter.from} and ts < ${filter.to}
            ${filter.slug ? tx`and slug = ${filter.slug}` : tx``}
            ${filter.source ? tx`and source = ${filter.source}` : tx``}
            group by slug, source, outcome, day, country, mcp_client_name, mcp_client_version
          `;
          const rolledValue: unknown = await tx`
            select slug, source, outcome, to_char(day, 'YYYY-MM-DD') as day, country,
              mcp_client, mcp_version, events::int as runs, error_events::int as errors, duration_hist
            from analytics_daily d
            where d.kind = 'run' and d.day >= ${fromDay}::date and d.day <= ${lastDay}::date
              and not exists (select 1 from tool_runs r where r.day = d.day)
            ${filter.slug ? tx`and d.slug = ${filter.slug}` : tx``}
            ${filter.source ? tx`and d.source = ${filter.source}` : tx``}
          `;
          const durationValue: unknown = await tx`
            select
              percentile_cont(0.5) within group (order by duration_ms) as p50,
              percentile_cont(0.95) within group (order by duration_ms) as p95,
              count(duration_ms)::int as samples
            from tool_runs
            where ts >= ${filter.from} and ts < ${filter.to} and duration_ms is not null
            ${filter.slug ? tx`and slug = ${filter.slug}` : tx``}
            ${filter.source ? tx`and source = ${filter.source}` : tx``}
          `;
          const rolledRows = rowsOf(rolledValue);
          const durationRow = rowsOf(durationValue)[0];
          const duration: DurationSummary = {
            p50: durationRow && durationRow.p50 !== null && durationRow.p50 !== undefined ? Math.round(num(durationRow.p50)) : null,
            p95: durationRow && durationRow.p95 !== null && durationRow.p95 !== undefined ? Math.round(num(durationRow.p95)) : null,
            samples: num(durationRow?.samples),
          };
          const histogram = rolledRows.reduce((hist, row) => {
            histOf(row.duration_hist).forEach((count, index) => {
              hist[index] = (hist[index] ?? 0) + count;
            });
            return hist;
          }, emptyHistogram());
          const summary = summarizeRuns(
            [...rowsOf(rawValue).map(countRow), ...rolledRows.map(countRow)],
            duration.samples > 0 ? duration : { p50: null, p95: null, samples: 0 },
            duration.samples > 0 ? null : histogram,
          );
          const includeWeb = !filter.source || filter.source === "web";
          const report = emptyReport(filter);
          if (!includeWeb) return { ...report, ...summary };
          const pagePath = filter.slug ? `/t/${filter.slug}` : null;
          const views = await countWhere(tx, "page_views", "page", filter, pagePath);
          const toolOpens = await countWhere(tx, "tool_opens", "tool_open", filter, filter.slug);
          const searches = filter.slug ? 0 : await countWhere(tx, "search_queries", "search", filter, null);
          const copies = await countActions(tx, "copy", filter);
          const downloads = await countActions(tx, "download", filter);
          const countryValue: unknown = await tx`
            select coalesce(country, '') as country, count(*)::int as runs
            from page_views
            where ts >= ${filter.from} and ts < ${filter.to}
            ${pagePath ? tx`and path = ${pagePath}` : tx``}
            group by country
          `;
          const rolledCountryValue: unknown = await tx`
            select country, sum(events)::int as runs
            from analytics_daily d
            where d.kind in ('page', 'run') and d.country <> ''
              and d.day >= ${fromDay}::date and d.day <= ${lastDay}::date
              and not exists (select 1 from tool_runs r where r.day = d.day)
              and not exists (select 1 from page_views p where p.day = d.day)
            group by country
          `;
          const extra = [...rowsOf(countryValue), ...rowsOf(rolledCountryValue)].map((row) => ({
            country: str(row.country),
            runs: num(row.runs),
          }));
          return {
            ...report,
            ...summary,
            topCountries: mergeCountries(summary.topCountries, extra),
            pages: { views, toolOpens, searches, copies, downloads },
          };
        });
      } catch (error) {
        console.warn("[analytics] stats failed", safeError(error));
        throw error;
      }
    },
  };
}

async function countWhere(
  tx: postgres.TransactionSql,
  table: "page_views" | "tool_opens" | "search_queries",
  kind: "page" | "tool_open" | "search",
  filter: StatsFilter,
  match: string | null,
): Promise<number> {
  const fromDay = utcDay(filter.from);
  const lastDay = utcDay(new Date(filter.to.getTime() - 1));
  if (table === "page_views") {
    const raw: unknown = await tx`
      select count(*)::int as n from page_views
      where ts >= ${filter.from} and ts < ${filter.to}
      ${match ? tx`and path = ${match}` : tx``}
    `;
    const rolled: unknown = await tx`
      select coalesce(sum(events), 0)::int as n from analytics_daily d
      where d.kind = ${kind} and d.day >= ${fromDay}::date and d.day <= ${lastDay}::date
        and not exists (select 1 from page_views p where p.day = d.day)
      ${match ? tx`and d.slug = ${match}` : tx``}
    `;
    return num(rowsOf(raw)[0]?.n) + num(rowsOf(rolled)[0]?.n);
  }
  if (table === "tool_opens") {
    const raw: unknown = await tx`
      select count(*)::int as n from tool_opens
      where ts >= ${filter.from} and ts < ${filter.to}
      ${match ? tx`and slug = ${match}` : tx``}
    `;
    const rolled: unknown = await tx`
      select coalesce(sum(events), 0)::int as n from analytics_daily d
      where d.kind = 'tool_open' and d.day >= ${fromDay}::date and d.day <= ${lastDay}::date
        and not exists (select 1 from tool_opens p where p.day = d.day)
      ${match ? tx`and d.slug = ${match}` : tx``}
    `;
    return num(rowsOf(raw)[0]?.n) + num(rowsOf(rolled)[0]?.n);
  }
  const raw: unknown = await tx`
    select count(*)::int as n from search_queries
    where ts >= ${filter.from} and ts < ${filter.to}
  `;
  const rolled: unknown = await tx`
    select coalesce(sum(events), 0)::int as n from analytics_daily d
    where d.kind = 'search' and d.day >= ${fromDay}::date and d.day <= ${lastDay}::date
      and not exists (select 1 from search_queries p where p.day = d.day)
  `;
  return num(rowsOf(raw)[0]?.n) + num(rowsOf(rolled)[0]?.n);
}

async function countActions(tx: postgres.TransactionSql, action: "copy" | "download", filter: StatsFilter): Promise<number> {
  const fromDay = utcDay(filter.from);
  const lastDay = utcDay(new Date(filter.to.getTime() - 1));
  const raw: unknown = await tx`
    select count(*)::int as n from ui_actions
    where ts >= ${filter.from} and ts < ${filter.to} and action = ${action}
    ${filter.slug ? tx`and slug = ${filter.slug}` : tx``}
  `;
  const rolled: unknown = await tx`
    select coalesce(sum(events), 0)::int as n from analytics_daily d
    where d.kind = 'action' and d.action = ${action}
      and d.day >= ${fromDay}::date and d.day <= ${lastDay}::date
      and not exists (select 1 from ui_actions a where a.day = d.day)
    ${filter.slug ? tx`and d.slug = ${filter.slug}` : tx``}
  `;
  return num(rowsOf(raw)[0]?.n) + num(rowsOf(rolled)[0]?.n);
}
