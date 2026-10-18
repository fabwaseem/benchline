import { describe, expect, it } from "vitest";
import { listOgTemplates, ogTemplateCategories } from "@/tools/og-template-list/lib/list";

describe("listOgTemplates", () => {
  it("returns every template id once", () => {
    const rows = listOgTemplates();
    expect(rows.length).toBeGreaterThan(0);
    expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length);
    expect(rows.every((row) => row.fields.length > 0)).toBe(true);
  });

  it("filters to one category", () => {
    const category = ogTemplateCategories[0];
    const rows = listOgTemplates(category);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.category === category)).toBe(true);
    expect(rows.length).toBeLessThan(listOgTemplates().length);
  });
});
