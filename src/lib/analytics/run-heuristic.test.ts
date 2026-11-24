import { describe, expect, it } from "vitest";
import { isViewOnlyControl, stateFingerprint, TOOL_REQUEST_PATHS, usesRunHeuristic } from "@/lib/analytics/run-heuristic";

describe("usesRunHeuristic", () => {
  it("is off for tools that report their own runs", () => {
    expect(usesRunHeuristic("llms-txt-generator")).toBe(false);
    for (const slug of Object.values(TOOL_REQUEST_PATHS)) expect(usesRunHeuristic(slug)).toBe(false);
  });

  it("is on for tools that run only in the browser", () => {
    expect(usesRunHeuristic("json-formatter")).toBe(true);
  });
});

describe("isViewOnlyControl", () => {
  it("skips tabs and view or share controls", () => {
    expect(isViewOnlyControl("llms-full.txt", "tab")).toBe(true);
    expect(isViewOnlyControl("Wrap", null)).toBe(true);
    expect(isViewOnlyControl("Copy JSON", null)).toBe(true);
    expect(isViewOnlyControl("Share", null)).toBe(true);
  });

  it("keeps controls that produce a result", () => {
    expect(isViewOnlyControl("Generate", null)).toBe(false);
    expect(isViewOnlyControl("Minify", null)).toBe(false);
  });
});

describe("stateFingerprint", () => {
  it("is stable for the same state and changes when it changes", () => {
    const a = stateFingerprint(["https://fabwaseem.com", "true"]);
    expect(stateFingerprint(["https://fabwaseem.com", "true"])).toBe(a);
    expect(stateFingerprint(["https://fabwaseem.com", "false"])).not.toBe(a);
    expect(stateFingerprint(["https://fabwaseem.co", "mtrue"])).not.toBe(a);
  });
});
