import { describe, expect, it } from "vitest";
import { formatSql } from "@/tools/sql-formatter/lib/sql";

describe("SQL formatter", () => {
  it("uppercases keywords and indents a select", () => {
    const result = formatSql("select a,b from t where x=1 and y=2", "postgresql", "upper", 2);
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.sql).toContain("SELECT");
    expect(result.sql).toContain("\n  a,");
    expect(result.sql).toContain("FROM");
    expect(result.sql).not.toContain("select");
  });

  it("can keep keywords lower and use a wider indent", () => {
    const result = formatSql("SELECT a FROM t", "mysql", "lower", 4);
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.sql.startsWith("select")).toBe(true);
    expect(result.sql).toContain("\n    a");
  });

  it("returns an empty string for blank input", () => {
    expect(formatSql("  \n", "sql", "preserve", 2)).toEqual({ sql: "" });
  });
});
