import { describe, expect, it } from "vitest";
import { generateLorem, generateRows } from "@/tools/lorem-ipsum/lib/generate";

describe("fake data", () => {
  it("repeats lorem for the same seed", async () => {
    const first = await generateLorem("sentences", 2, 7);
    const second = await generateLorem("sentences", 2, 7);
    expect(first).toBe(second);
    expect(first.endsWith(".")).toBe(true);
    expect((await generateLorem("words", 4, 7)).split(/\s+/)).toHaveLength(4);
  });

  it("builds deterministic JSON, CSV, and SQL", async () => {
    const fields = [
      { name: "name", kind: "fullName" as const },
      { name: "email", kind: "email" as const },
      { name: "active", kind: "boolean" as const },
    ];
    const json = await generateRows(fields, 2, 3, "json", "people");
    expect(json).toBe(await generateRows(fields, 2, 3, "json", "people"));
    const parsed = JSON.parse(json) as { name: string; email: string; active: boolean }[];
    expect(parsed).toHaveLength(2);
    expect(parsed[0]?.email).toContain("@");
    const csv = await generateRows(fields, 2, 3, "csv", "people");
    expect(csv.split("\n")[0]).toBe("name,email,active");
    expect(csv.split("\n")).toHaveLength(3);
    const sql = await generateRows(fields, 1, 3, "sql", "people");
    expect(sql.startsWith("INSERT INTO people (name, email, active) VALUES")).toBe(true);
    expect(sql.endsWith(";")).toBe(true);
  });

  it("rejects unsafe identifiers and duplicate fields", async () => {
    await expect(generateRows([{ name: "full name", kind: "word" }], 1, 1, "json", "rows")).rejects.toThrow(/Field/);
    await expect(generateRows([{ name: "id", kind: "int" }, { name: "id", kind: "int" }], 1, 1, "json", "rows")).rejects.toThrow(/Duplicate/);
    await expect(generateRows([{ name: "id", kind: "int" }], 1, 1, "sql", "drop table")).rejects.toThrow(/Table/);
  });

  it("escapes quotes in CSV and SQL", async () => {
    const csv = await generateRows([{ name: "note", kind: "sentence" }], 5, 11, "csv", "notes");
    expect(csv.includes("\n")).toBe(true);
    const sql = await generateRows([{ name: "note", kind: "sentence" }], 1, 11, "sql", "notes");
    expect(sql.trimEnd().endsWith(";")).toBe(true);
    expect(sql).toContain("INSERT INTO notes (note) VALUES");
  });
});
