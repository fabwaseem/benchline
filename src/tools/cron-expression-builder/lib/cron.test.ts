import { describe, expect, it } from "vitest";
import { explainCron, setField } from "@/tools/cron-expression-builder/lib/cron";

describe("explainCron", () => {
  it("explains a 5-field expression and lists the next runs in UTC", () => {
    const result = explainCron("*/5 * * * *", "standard", "UTC", new Date("2026-01-01T00:00:30Z"));
    expect(result.valid).toBe(true);
    expect(result.english.toLowerCase()).toContain("5");
    expect(result.runs).toHaveLength(10);
    expect(result.runs[0]?.utc).toContain("00:05");
    expect(result.snippets.some((snippet) => snippet.label === "vercel.json")).toBe(true);
  });

  it("describes @reboot and rejects a broken field", () => {
    expect(explainCron("@reboot", "standard", "UTC").english).toContain("starts");
    expect(explainCron("61 * * * *", "standard", "UTC").valid).toBe(false);
    expect(setField("0 0 * * *", 0, "*/15")).toBe("*/15 0 * * *");
  });
});
