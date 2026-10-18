import { describe, expect, it } from "vitest";
import { buildPolicy, documentFor, lintPolicy, nextPreset, parsePolicy, strictPreset } from "@/tools/csp-generator/lib/csp";

describe("csp", () => {
  it("builds a strict policy and a Next.js snippet", () => {
    const doc = documentFor(strictPreset);
    expect(doc.policy).toContain("default-src 'none'");
    expect(doc.policy).toContain("object-src 'none'");
    expect(doc.header.startsWith("Content-Security-Policy:")).toBe(true);
    expect(doc.nextConfig).toContain("async headers()");
    expect(doc.checks.some((check) => check.label === "object-src" && check.level === "pass")).toBe(true);
  });

  it("warns on unsafe-inline and keeps an unknown directive visible", () => {
    const policy = buildPolicy(nextPreset);
    const checks = lintPolicy(policy);
    expect(checks.some((check) => check.label === "unsafe-inline")).toBe(true);
    const parsed = parsePolicy(`${policy}; report-to csp`);
    expect(parsed.unknown).toEqual(["report-to csp"]);
    expect(lintPolicy(`${policy}; report-to csp`).some((check) => check.detail.includes("report-to"))).toBe(true);
  });
});
