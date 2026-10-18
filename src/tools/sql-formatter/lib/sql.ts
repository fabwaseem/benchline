import { format, type KeywordCase, type SqlLanguage } from "sql-formatter";

export const dialects = [
  "postgresql",
  "mysql",
  "mariadb",
  "sqlite",
  "transactsql",
  "bigquery",
  "snowflake",
  "redshift",
  "spark",
  "hive",
  "plsql",
  "trino",
  "sql",
] as const satisfies readonly SqlLanguage[];

export type Dialect = (typeof dialects)[number];

export const keywordCases = ["upper", "lower", "preserve"] as const satisfies readonly KeywordCase[];
export type KeywordStyle = (typeof keywordCases)[number];

export const indents = [2, 4] as const;
export type SqlIndent = (typeof indents)[number];

export const dialectLabels: Record<Dialect, string> = {
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  mariadb: "MariaDB",
  sqlite: "SQLite",
  transactsql: "T-SQL",
  bigquery: "BigQuery",
  snowflake: "Snowflake",
  redshift: "Redshift",
  spark: "Spark",
  hive: "Hive",
  plsql: "PL/SQL",
  trino: "Trino",
  sql: "Standard SQL",
};

export type SqlResult = { sql: string } | { error: string };

export function formatSql(sql: string, dialect: Dialect, keywordCase: KeywordStyle, indent: SqlIndent): SqlResult {
  if (sql.length > 200_000) return { error: "Use a query of 200,000 characters or fewer." };
  if (sql.trim().length === 0) return { sql: "" };
  try {
    return {
      sql: format(sql, {
        language: dialect,
        keywordCase,
        tabWidth: indent,
        useTabs: false,
      }),
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "That SQL could not be formatted." };
  }
}

export const exampleSql = "select id, name from users where active = true and created_at > '2026-01-01' order by name";
