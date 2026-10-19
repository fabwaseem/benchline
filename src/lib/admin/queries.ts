import { utcDay } from "@/lib/analytics/text";
import type { AdminScope } from "@/lib/admin/range";
import type { RunOutcome, RunSource } from "@/lib/analytics/types";

export type Sql = { text: string; values: unknown[] };

class Params {
  values: unknown[] = [];
  add(value: unknown): string {
    this.values.push(value);
    return `$${this.values.length}`;
  }
  sql(text: string): Sql {
    return { text: text.replace(/[ \t]+\n/g, "\n").trim(), values: this.values };
  }
}

const HIST = `array[
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

const HIST_SUM = `array[
  coalesce(sum(d.duration_hist[1]), 0)::int,
  coalesce(sum(d.duration_hist[2]), 0)::int,
  coalesce(sum(d.duration_hist[3]), 0)::int,
  coalesce(sum(d.duration_hist[4]), 0)::int,
  coalesce(sum(d.duration_hist[5]), 0)::int,
  coalesce(sum(d.duration_hist[6]), 0)::int,
  coalesce(sum(d.duration_hist[7]), 0)::int,
  coalesce(sum(d.duration_hist[8]), 0)::int,
  coalesce(sum(d.duration_hist[9]), 0)::int,
  coalesce(sum(d.duration_hist[10]), 0)::int,
  coalesce(sum(d.duration_hist[11]), 0)::int
]::integer[]`;

function bucketExpr(unit: "hour" | "day"): string {
  if (unit === "hour") return `to_char(date_trunc('hour', ts) at time zone 'UTC', 'YYYY-MM-DD"T"HH24:00')`;
  return `to_char(date_trunc('day', ts) at time zone 'UTC', 'YYYY-MM-DD')`;
}

type Window = {
  from: string;
  to: string;
  fromDay: string;
  toDay: string;
  slug: string | null;
  source: string | null;
};

function windowOf(p: Params, scope: AdminScope, opts?: { days?: boolean; slug?: boolean; source?: boolean }): Window {
  return {
    from: p.add(scope.from),
    to: p.add(scope.to),
    fromDay: opts?.days === false ? "" : p.add(utcDay(scope.from)),
    toDay: opts?.days === false ? "" : p.add(utcDay(new Date(scope.to.getTime() - 1))),
    slug: opts?.slug === false || !scope.slug ? null : p.add(scope.slug),
    source: opts?.source === false || !scope.source ? null : p.add(scope.source),
  };
}

function andEq(column: string, placeholder: string | null): string {
  return placeholder ? ` and ${column} = ${placeholder}` : "";
}

function daySpan(w: Window, alias = "d"): string {
  return `${alias}.day >= ${w.fromDay}::date and ${alias}.day <= ${w.toDay}::date`;
}

/** Hourly series stay on raw rows. Daily series add rolled days that no longer have raw rows. */
export function runsSeriesQuery(scope: AdminScope): Sql {
  const p = new Params();
  const w = windowOf(p, scope, { days: scope.unit === "day" });
  const filter = `${andEq("slug", w.slug)}${andEq("source", w.source)}`;
  const dailyFilter = `${andEq("d.slug", w.slug)}${andEq("d.source", w.source)}`;
  const daily =
    scope.unit === "day"
      ? `
    union all
    select to_char(d.day, 'YYYY-MM-DD') as bucket, d.source,
      sum(d.events)::bigint as runs,
      sum(d.events) filter (where d.outcome = 'ok')::bigint as ok,
      sum(d.events) filter (where d.outcome = 'error')::bigint as err,
      sum(d.events) filter (where d.outcome = 'rejected')::bigint as rejected
    from analytics_daily d
    where d.kind = 'run' and ${daySpan(w)}
      and not exists (select 1 from tool_runs r where r.day = d.day)${dailyFilter}
    group by 1, 2`
      : "";
  return p.sql(`
    select bucket, source, sum(runs)::bigint as runs, sum(ok)::bigint as ok, sum(err)::bigint as err, sum(rejected)::bigint as rejected
    from (
      select ${bucketExpr(scope.unit)} as bucket, source,
        count(*)::bigint as runs,
        count(*) filter (where outcome = 'ok')::bigint as ok,
        count(*) filter (where outcome = 'error')::bigint as err,
        count(*) filter (where outcome = 'rejected')::bigint as rejected
      from tool_runs
      where ts >= ${w.from} and ts < ${w.to}${filter}
      group by 1, 2${daily}
    ) s
    group by bucket, source
    order by bucket
  `);
}

export function toolUsageQuery(scope: AdminScope): Sql {
  const p = new Params();
  const w = windowOf(p, scope);
  const filter = `${andEq("slug", w.slug)}${andEq("source", w.source)}`;
  const dailyFilter = `${andEq("d.slug", w.slug)}${andEq("d.source", w.source)}`;
  return p.sql(`
    select slug,
      sum(runs)::bigint as runs,
      sum(ok)::bigint as ok,
      sum(errors)::bigint as errors,
      sum(rejected)::bigint as rejected,
      sum(web)::bigint as web,
      sum(mcp)::bigint as mcp,
      sum(api)::bigint as api
    from (
      select slug,
        count(*)::bigint as runs,
        count(*) filter (where outcome = 'ok')::bigint as ok,
        count(*) filter (where outcome = 'error')::bigint as errors,
        count(*) filter (where outcome = 'rejected')::bigint as rejected,
        count(*) filter (where source = 'web')::bigint as web,
        count(*) filter (where source = 'mcp')::bigint as mcp,
        count(*) filter (where source = 'api')::bigint as api
      from tool_runs
      where ts >= ${w.from} and ts < ${w.to}${filter}
      group by slug
      union all
      select d.slug,
        sum(d.events)::bigint,
        sum(d.events) filter (where d.outcome = 'ok')::bigint,
        sum(d.events) filter (where d.outcome = 'error')::bigint,
        sum(d.events) filter (where d.outcome = 'rejected')::bigint,
        sum(d.events) filter (where d.source = 'web')::bigint,
        sum(d.events) filter (where d.source = 'mcp')::bigint,
        sum(d.events) filter (where d.source = 'api')::bigint
      from analytics_daily d
      where d.kind = 'run' and ${daySpan(w)}
        and not exists (select 1 from tool_runs r where r.day = d.day)${dailyFilter}
      group by d.slug
    ) t
    group by slug
  `);
}

export function toolSeriesQuery(scope: AdminScope): Sql {
  const p = new Params();
  const w = windowOf(p, scope, { days: scope.unit === "day" });
  const filter = `${andEq("slug", w.slug)}${andEq("source", w.source)}`;
  const dailyFilter = `${andEq("d.slug", w.slug)}${andEq("d.source", w.source)}`;
  const daily =
    scope.unit === "day"
      ? `
      union all
      select d.slug, to_char(d.day, 'YYYY-MM-DD') as bucket, sum(d.events)::bigint as runs
      from analytics_daily d
      where d.kind = 'run' and ${daySpan(w)}
        and not exists (select 1 from tool_runs r where r.day = d.day)${dailyFilter}
      group by 1, 2`
      : "";
  return p.sql(`
    select slug, bucket, sum(runs)::bigint as runs
    from (
      select slug, ${bucketExpr(scope.unit)} as bucket, count(*)::bigint as runs
      from tool_runs
      where ts >= ${w.from} and ts < ${w.to}${filter}
      group by 1, 2${daily}
    ) s
    group by slug, bucket
    order by slug, bucket
  `);
}

export function opensQuery(scope: AdminScope): Sql {
  const p = new Params();
  const w = windowOf(p, scope, { source: false });
  return p.sql(`
    select slug, sum(opens)::bigint as opens
    from (
      select slug, count(*)::bigint as opens
      from tool_opens
      where ts >= ${w.from} and ts < ${w.to}${andEq("slug", w.slug)}
      group by slug
      union all
      select d.slug, sum(d.events)::bigint
      from analytics_daily d
      where d.kind = 'tool_open' and ${daySpan(w)}
        and not exists (select 1 from tool_opens o where o.day = d.day)${andEq("d.slug", w.slug)}
      group by d.slug
    ) t
    group by slug
  `);
}

export function visitorsQuery(scope: AdminScope, series: boolean): Sql {
  const p = new Params();
  const from = p.add(scope.from);
  const to = p.add(scope.to);
  const slug = scope.slug ? p.add(scope.slug) : null;
  const path = scope.slug ? p.add(`/t/${scope.slug}`) : null;
  const bucket = series ? `${bucketExpr(scope.unit)} as bucket, ` : "";
  const outer = series ? "select bucket, count(*)::bigint as visitors from (" : "select count(*)::bigint as visitors from (";
  const close = series ? ") v group by bucket order by bucket" : ") v";
  return p.sql(`
    ${outer}
      select ${bucket}visitor_id from tool_runs
      where ts >= ${from} and ts < ${to} and visitor_id is not null${andEq("slug", slug)}
      union
      select ${bucket}visitor_id from page_views
      where ts >= ${from} and ts < ${to} and visitor_id is not null${andEq("path", path)}
      union
      select ${bucket}visitor_id from tool_opens
      where ts >= ${from} and ts < ${to} and visitor_id is not null${andEq("slug", slug)}
    ${close}
  `);
}

export function visitorsByToolQuery(scope: AdminScope): Sql {
  const p = new Params();
  const from = p.add(scope.from);
  const to = p.add(scope.to);
  const slug = scope.slug ? p.add(scope.slug) : null;
  return p.sql(`
    select slug, count(distinct visitor_id)::bigint as users
    from tool_runs
    where ts >= ${from} and ts < ${to} and visitor_id is not null${andEq("slug", slug)}
    group by slug
  `);
}

export function pageViewsQuery(scope: AdminScope, series: boolean): Sql {
  const p = new Params();
  const from = p.add(scope.from);
  const to = p.add(scope.to);
  const useDaily = !series || scope.unit === "day";
  const fromDay = useDaily ? p.add(utcDay(scope.from)) : "";
  const toDay = useDaily ? p.add(utcDay(new Date(scope.to.getTime() - 1))) : "";
  const path = scope.slug ? p.add(`/t/${scope.slug}`) : null;
  const span = `d.day >= ${fromDay}::date and d.day <= ${toDay}::date`;
  if (!series) {
    return p.sql(`
      select (
        (select count(*)::bigint from page_views where ts >= ${from} and ts < ${to}${andEq("path", path)})
        +
        (select coalesce(sum(d.events), 0)::bigint from analytics_daily d
          where d.kind = 'page' and ${span}
            and not exists (select 1 from page_views p where p.day = d.day)${andEq("d.slug", path)})
      ) as views
    `);
  }
  const daily =
    scope.unit === "day"
      ? `
      union all
      select to_char(d.day, 'YYYY-MM-DD') as bucket, sum(d.events)::bigint as views
      from analytics_daily d
      where d.kind = 'page' and ${span}
        and not exists (select 1 from page_views p where p.day = d.day)${andEq("d.slug", path)}
      group by 1`
      : "";
  return p.sql(`
    select bucket, sum(views)::bigint as views
    from (
      select ${bucketExpr(scope.unit)} as bucket, count(*)::bigint as views
      from page_views
      where ts >= ${from} and ts < ${to}${andEq("path", path)}
      group by 1${daily}
    ) s
    group by bucket
    order by bucket
  `);
}

export function mcpSessionsQuery(scope: AdminScope, series: boolean): Sql {
  const p = new Params();
  const from = p.add(scope.from);
  const to = p.add(scope.to);
  const slug = scope.slug ? p.add(scope.slug) : null;
  if (!series) {
    return p.sql(`
      select count(distinct mcp_session_id)::bigint as sessions
      from tool_runs
      where source = 'mcp' and ts >= ${from} and ts < ${to} and mcp_session_id is not null${andEq("slug", slug)}
    `);
  }
  return p.sql(`
    select ${bucketExpr(scope.unit)} as bucket, count(distinct mcp_session_id)::bigint as sessions
    from tool_runs
    where source = 'mcp' and ts >= ${from} and ts < ${to} and mcp_session_id is not null${andEq("slug", slug)}
    group by 1
    order by 1
  `);
}

export function durationPercentileQuery(scope: AdminScope, series: boolean): Sql {
  const p = new Params();
  const w = windowOf(p, scope, { days: false });
  const filter = `${andEq("slug", w.slug)}${andEq("source", w.source)}`;
  if (!series) {
    return p.sql(`
      select
        percentile_cont(0.5) within group (order by duration_ms) as p50,
        percentile_cont(0.95) within group (order by duration_ms) as p95,
        count(duration_ms)::bigint as samples
      from tool_runs
      where ts >= ${w.from} and ts < ${w.to} and duration_ms is not null${filter}
    `);
  }
  return p.sql(`
    select ${bucketExpr(scope.unit)} as bucket,
      percentile_cont(0.5) within group (order by duration_ms) as p50,
      percentile_cont(0.95) within group (order by duration_ms) as p95
    from tool_runs
    where ts >= ${w.from} and ts < ${w.to} and duration_ms is not null${filter}
    group by 1
    order by 1
  `);
}

export function durationHistogramQuery(scope: AdminScope): Sql {
  const p = new Params();
  const w = windowOf(p, scope);
  const filter = `${andEq("slug", w.slug)}${andEq("source", w.source)}`;
  const dailyFilter = `${andEq("d.slug", w.slug)}${andEq("d.source", w.source)}`;
  return p.sql(`
    select ${HIST} as hist
    from tool_runs
    where ts >= ${w.from} and ts < ${w.to}${filter}
    union all
    select ${HIST_SUM} as hist
    from analytics_daily d
    where d.kind = 'run' and ${daySpan(w)}
      and not exists (select 1 from tool_runs r where r.day = d.day)${dailyFilter}
  `);
}

export function durationHistogramByToolQuery(scope: AdminScope): Sql {
  const p = new Params();
  const w = windowOf(p, scope);
  const filter = `${andEq("slug", w.slug)}${andEq("source", w.source)}`;
  const dailyFilter = `${andEq("d.slug", w.slug)}${andEq("d.source", w.source)}`;
  return p.sql(`
    select slug, hist from (
      select slug, ${HIST} as hist
      from tool_runs
      where ts >= ${w.from} and ts < ${w.to}${filter}
      group by slug
      union all
      select d.slug, ${HIST_SUM} as hist
      from analytics_daily d
      where d.kind = 'run' and ${daySpan(w)}
        and not exists (select 1 from tool_runs r where r.day = d.day)${dailyFilter}
      group by d.slug
    ) h
  `);
}

export function countriesQuery(scope: AdminScope): Sql {
  const p = new Params();
  const w = windowOf(p, scope);
  const filter = `${andEq("slug", w.slug)}${andEq("source", w.source)}`;
  const dailyFilter = `${andEq("d.slug", w.slug)}${andEq("d.source", w.source)}`;
  return p.sql(`
    select country, sum(runs)::bigint as runs
    from (
      select coalesce(country, '') as country, count(*)::bigint as runs
      from tool_runs
      where ts >= ${w.from} and ts < ${w.to} and country is not null and country <> ''${filter}
      group by 1
      union all
      select d.country, sum(d.events)::bigint
      from analytics_daily d
      where d.kind = 'run' and d.country <> '' and ${daySpan(w)}
        and not exists (select 1 from tool_runs r where r.day = d.day)${dailyFilter}
      group by d.country
    ) c
    group by country
    order by runs desc, country
    limit 30
  `);
}

export function clientsQuery(scope: AdminScope): Sql {
  const p = new Params();
  const w = windowOf(p, scope, { source: false });
  return p.sql(`
    select name, version, sum(runs)::bigint as runs
    from (
      select coalesce(mcp_client_name, '') as name, coalesce(mcp_client_version, '') as version, count(*)::bigint as runs
      from tool_runs
      where source = 'mcp' and ts >= ${w.from} and ts < ${w.to}
        and mcp_client_name is not null and mcp_client_name <> ''${andEq("slug", w.slug)}
      group by 1, 2
      union all
      select d.mcp_client, d.mcp_version, sum(d.events)::bigint
      from analytics_daily d
      where d.kind = 'run' and d.source = 'mcp' and d.mcp_client <> '' and ${daySpan(w)}
        and not exists (select 1 from tool_runs r where r.day = d.day)${andEq("d.slug", w.slug)}
      group by 1, 2
    ) c
    group by name, version
    order by runs desc, name
    limit 20
  `);
}

export function referrersQuery(scope: AdminScope): Sql {
  const p = new Params();
  const from = p.add(scope.from);
  const to = p.add(scope.to);
  return p.sql(`
    select referrer_host as host, count(*)::bigint as views
    from page_views
    where ts >= ${from} and ts < ${to} and referrer_host is not null and referrer_host <> ''
    group by referrer_host
    order by views desc, host
    limit 20
  `);
}

export function utmQuery(scope: AdminScope): Sql {
  const p = new Params();
  const from = p.add(scope.from);
  const to = p.add(scope.to);
  return p.sql(`
    select coalesce(utm_source, '') as source, coalesce(utm_medium, '') as medium, coalesce(utm_campaign, '') as campaign, count(*)::bigint as views
    from page_views
    where ts >= ${from} and ts < ${to}
      and (utm_source is not null or utm_medium is not null or utm_campaign is not null)
    group by 1, 2, 3
    order by views desc
    limit 20
  `);
}

export function devicesQuery(scope: AdminScope): Sql {
  const p = new Params();
  const from = p.add(scope.from);
  const to = p.add(scope.to);
  const fromDay = p.add(utcDay(scope.from));
  const toDay = p.add(utcDay(new Date(scope.to.getTime() - 1)));
  return p.sql(`
    select device, sum(views)::bigint as views
    from (
      select coalesce(device_class, 'unknown') as device, count(*)::bigint as views
      from page_views
      where ts >= ${from} and ts < ${to}
      group by 1
      union all
      select coalesce(nullif(d.device_class, ''), 'unknown'), sum(d.events)::bigint
      from analytics_daily d
      where d.kind = 'page' and d.day >= ${fromDay}::date and d.day <= ${toDay}::date
        and not exists (select 1 from page_views p where p.day = d.day)
      group by 1
    ) d
    group by device
    order by views desc
  `);
}

export function searchesQuery(scope: AdminScope): Sql {
  const p = new Params();
  const from = p.add(scope.from);
  const to = p.add(scope.to);
  return p.sql(`
    select query, count(*)::bigint as count
    from search_queries
    where ts >= ${from} and ts < ${to}
    group by query
    order by count desc, query
    limit 50
  `);
}

export function rolledSearchesQuery(scope: AdminScope): Sql {
  const p = new Params();
  const fromDay = p.add(utcDay(scope.from));
  const toDay = p.add(utcDay(new Date(scope.to.getTime() - 1)));
  return p.sql(`
    select coalesce(sum(d.events), 0)::bigint as rolled
    from analytics_daily d
    where d.kind = 'search' and d.day >= ${fromDay}::date and d.day <= ${toDay}::date
      and not exists (select 1 from search_queries q where q.day = d.day)
  `);
}

export function errorsQuery(scope: AdminScope): Sql {
  const p = new Params();
  const w = windowOf(p, scope, { days: scope.unit === "day", source: false });
  const daily =
    scope.unit === "day"
      ? `
      union all
      select d.slug, 'rolled' as code, to_char(d.day, 'YYYY-MM-DD') as bucket, sum(d.error_events)::bigint as n
      from analytics_daily d
      where d.kind = 'run' and d.error_events > 0 and ${daySpan(w)}
        and not exists (select 1 from tool_runs r where r.day = d.day)${andEq("d.slug", w.slug)}
      group by 1, 3`
      : "";
  return p.sql(`
    select slug, code, bucket, sum(n)::bigint as n
    from (
      select slug, coalesce(error_code, 'error') as code, ${bucketExpr(scope.unit)} as bucket, count(*)::bigint as n
      from tool_runs
      where outcome = 'error' and ts >= ${w.from} and ts < ${w.to}${andEq("slug", w.slug)}
      group by 1, 2, 3${daily}
    ) e
    group by slug, code, bucket
    order by bucket, n desc
  `);
}

export function liveQuery(scope: Pick<AdminScope, "from" | "to" | "slug" | "source">, outcome: RunOutcome | null, limit = 80): Sql {
  const p = new Params();
  const from = p.add(scope.from);
  const to = p.add(scope.to);
  const source = scope.source ? p.add(scope.source) : null;
  const slug = scope.slug ? p.add(scope.slug) : null;
  const outcomeParam = outcome ? p.add(outcome) : null;
  const cap = p.add(limit);
  return p.sql(`
    select id, ts, slug, source, outcome, error_code, duration_ms, country,
      mcp_client_name, mcp_client_version, mcp_protocol, mcp_host
    from tool_runs
    where ts >= ${from} and ts < ${to}${andEq("source", source)}${andEq("slug", slug)}${andEq("outcome", outcomeParam)}
    order by ts desc
    limit ${cap}
  `);
}

export function mcpProtocolQuery(scope: AdminScope): Sql {
  const p = new Params();
  const from = p.add(scope.from);
  const to = p.add(scope.to);
  return p.sql(`
    select coalesce(nullif(mcp_protocol, ''), 'unknown') as protocol, count(*)::bigint as runs
    from tool_runs
    where source = 'mcp' and ts >= ${from} and ts < ${to}
    group by 1
    order by runs desc
  `);
}

export function mcpHostQuery(scope: AdminScope): Sql {
  const p = new Params();
  const from = p.add(scope.from);
  const to = p.add(scope.to);
  return p.sql(`
    select coalesce(nullif(mcp_host, ''), 'unknown') as host,
      count(*)::bigint as runs,
      count(distinct mcp_session_id)::bigint as sessions
    from tool_runs
    where source = 'mcp' and ts >= ${from} and ts < ${to}
    group by 1
    order by runs desc
  `);
}

export function rolledMcpQuery(scope: AdminScope): Sql {
  const p = new Params();
  const fromDay = p.add(utcDay(scope.from));
  const toDay = p.add(utcDay(new Date(scope.to.getTime() - 1)));
  return p.sql(`
    select coalesce(sum(d.events), 0)::bigint as rolled
    from analytics_daily d
    where d.kind = 'run' and d.source = 'mcp' and d.day >= ${fromDay}::date and d.day <= ${toDay}::date
      and not exists (select 1 from tool_runs r where r.day = d.day)
  `);
}

export type LiveFilter = {
  from: Date;
  to: Date;
  source: RunSource | null;
  slug: string | null;
  outcome: RunOutcome | null;
};
