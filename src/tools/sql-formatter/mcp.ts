import { z } from "zod";
import { dialects, formatSql, indents, keywordCases } from "@/tools/sql-formatter/lib/sql";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  sql: z.string().describe("SQL to format."),
  dialect: z.enum(dialects).default("postgresql"),
  keywordCase: z.enum(keywordCases).default("upper"),
  indent: z.union([z.literal(2), z.literal(4)]).default(2),
});

export const outputSchema = z.object({
  sql: z.string(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const indent = indents.find((item) => item === parsed.indent) ?? 2;
  const result = formatSql(parsed.sql, parsed.dialect, parsed.keywordCase, indent);
  if ("error" in result) throw new Error(result.error);
  return outputSchema.parse(result);
}

export const tool: BenchTool = {
  slug: "sql-formatter",
  name: "format_sql",
  title: "Format SQL",
  description: "Format SQL for PostgreSQL, MySQL, BigQuery, Snowflake, and other dialects. Choose keyword case and an indent of 2 or 4 spaces.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
