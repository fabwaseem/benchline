import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "sql-formatter",
  name: "SQL formatter",
  tagline: "Format SQL for PostgreSQL, MySQL, BigQuery, Snowflake, and other dialects.",
  description:
    "Free SQL formatter. Pick a dialect, choose upper, lower, or preserved keywords, and indent with 2 or 4 spaces. Formatting runs in the browser.",
  category: "sql",
  tags: ["sql", "format"],
  keywords: ["sql formatter", "format sql", "postgresql formatter"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Database",
  related: ["json-formatter", "regex-tester", "json-yaml-convert", "csv-json-convert"],
  faqs: [
    { q: "Does this run the query?", a: "No. It only changes whitespace and keyword case. It does not connect to a database." },
    { q: "Which dialects are included?", a: "PostgreSQL, MySQL, MariaDB, SQLite, T-SQL, BigQuery, Snowflake, Redshift, Spark, Hive, PL/SQL, Trino, and a standard SQL dialect." },
    { q: "Will it fix a syntax error?", a: "It formats the text it can read. A broken query may still format, or it may report that it could not be formatted. It does not rewrite the logic." },
  ],
  seo: {
    title: "SQL formatter",
    description: "Format SQL for PostgreSQL, MySQL, BigQuery, Snowflake, and other dialects.",
  },
  howTo: [
    { name: "Paste a query", text: "Drop a SELECT, an INSERT, or a longer script into the editor." },
    { name: "Pick a dialect", text: "Keyword rules differ. PostgreSQL and BigQuery are both in the list." },
    { name: "Copy the formatted SQL", text: "Choose keyword case and indent, then copy or download the result." },
  ],
  inputs: "SQL text, a dialect, keyword case, and an indent of 2 or 4 spaces.",
  outputs: "Formatted SQL.",
  runsLocally: true,
  badges: ["Dialects · Keyword case"],
} satisfies ToolMeta;
