export type Migration = {
  version: string;
  statements: string[];
};

export const BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
)
`;

export const MIGRATIONS: Migration[] = [
  {
    version: "001_analytics",
    statements: [
      `CREATE TABLE IF NOT EXISTS tool_runs (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        ts timestamptz NOT NULL,
        slug text NOT NULL,
        source text NOT NULL,
        outcome text NOT NULL,
        error_code text,
        duration_ms integer,
        input_bytes integer,
        output_bytes integer,
        ip_hash text,
        country text,
        ua_family text,
        referrer_host text,
        visitor_id text,
        session_id text,
        mcp_session_id text,
        mcp_client_name text,
        mcp_client_version text,
        mcp_protocol text,
        mcp_host text,
        day date NOT NULL,
        CONSTRAINT tool_runs_source_chk CHECK (source IN ('mcp', 'api', 'web')),
        CONSTRAINT tool_runs_outcome_chk CHECK (outcome IN ('ok', 'error', 'rejected')),
        CONSTRAINT tool_runs_host_chk CHECK (mcp_host IS NULL OR mcp_host IN ('benchline', 'legacy'))
      )`,
      `CREATE INDEX IF NOT EXISTS tool_runs_ts_idx ON tool_runs (ts)`,
      `CREATE INDEX IF NOT EXISTS tool_runs_slug_ts_idx ON tool_runs (slug, ts)`,
      `CREATE INDEX IF NOT EXISTS tool_runs_source_ts_idx ON tool_runs (source, ts)`,
      `CREATE INDEX IF NOT EXISTS tool_runs_day_slug_source_idx ON tool_runs (day, slug, source)`,
      `CREATE TABLE IF NOT EXISTS page_views (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        ts timestamptz NOT NULL,
        path text NOT NULL,
        referrer_host text,
        utm_source text,
        utm_medium text,
        utm_campaign text,
        utm_term text,
        utm_content text,
        device_class text,
        ip_hash text,
        country text,
        ua_family text,
        visitor_id text,
        session_id text,
        day date NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS page_views_ts_idx ON page_views (ts)`,
      `CREATE INDEX IF NOT EXISTS page_views_path_ts_idx ON page_views (path, ts)`,
      `CREATE TABLE IF NOT EXISTS tool_opens (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        ts timestamptz NOT NULL,
        slug text NOT NULL,
        referrer_host text,
        device_class text,
        ip_hash text,
        country text,
        ua_family text,
        visitor_id text,
        session_id text,
        day date NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS tool_opens_ts_idx ON tool_opens (ts)`,
      `CREATE INDEX IF NOT EXISTS tool_opens_slug_ts_idx ON tool_opens (slug, ts)`,
      `CREATE TABLE IF NOT EXISTS search_queries (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        ts timestamptz NOT NULL,
        query text NOT NULL,
        ip_hash text,
        country text,
        ua_family text,
        visitor_id text,
        session_id text,
        day date NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS search_queries_ts_idx ON search_queries (ts)`,
      `CREATE TABLE IF NOT EXISTS ui_actions (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        ts timestamptz NOT NULL,
        action text NOT NULL,
        slug text,
        ip_hash text,
        country text,
        ua_family text,
        visitor_id text,
        session_id text,
        day date NOT NULL,
        CONSTRAINT ui_actions_action_chk CHECK (action IN ('copy', 'download'))
      )`,
      `CREATE INDEX IF NOT EXISTS ui_actions_ts_idx ON ui_actions (ts)`,
      `CREATE INDEX IF NOT EXISTS ui_actions_action_ts_idx ON ui_actions (action, ts)`,
      `CREATE TABLE IF NOT EXISTS analytics_daily (
        day date NOT NULL,
        kind text NOT NULL,
        slug text NOT NULL DEFAULT '',
        source text NOT NULL DEFAULT '',
        outcome text NOT NULL DEFAULT '',
        country text NOT NULL DEFAULT '',
        mcp_client text NOT NULL DEFAULT '',
        mcp_version text NOT NULL DEFAULT '',
        action text NOT NULL DEFAULT '',
        device_class text NOT NULL DEFAULT '',
        events bigint NOT NULL,
        error_events bigint NOT NULL DEFAULT 0,
        duration_count bigint NOT NULL DEFAULT 0,
        duration_sum_ms bigint NOT NULL DEFAULT 0,
        duration_hist integer[] NOT NULL DEFAULT ARRAY[0,0,0,0,0,0,0,0,0,0,0]::integer[],
        PRIMARY KEY (day, kind, slug, source, outcome, country, mcp_client, mcp_version, action, device_class)
      )`,
      `CREATE INDEX IF NOT EXISTS analytics_daily_day_kind_idx ON analytics_daily (day, kind)`,
    ],
  },
];

export const PRUNE_SQL = [
  "DELETE FROM tool_runs WHERE ts < now() - interval '90 days'",
  "DELETE FROM page_views WHERE ts < now() - interval '90 days'",
  "DELETE FROM tool_opens WHERE ts < now() - interval '90 days'",
  "DELETE FROM search_queries WHERE ts < now() - interval '90 days'",
  "DELETE FROM ui_actions WHERE ts < now() - interval '90 days'",
];
