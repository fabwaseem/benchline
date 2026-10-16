import { describe, expect, it } from "vitest";
import { claimRows, claimViews, decodeJwt, EXAMPLE_TOKEN, formatUtc, isDecoded } from "@/tools/jwt-decoder/lib/jwt";

const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZGEiLCJuYW1lIjoiQWRhIExvdmVsYWNlIiwiaXNzIjoidG9vbHNtaXRoIiwiYXVkIjoiYmVuY2giLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.signature";

describe("decodeJwt", () => {
  it("decodes a bearer token and unicode payload", () => {
    const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" })).replace(/=/g, "").replace(/\+/g, "-");
    const payload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify({ name: "café" })));
    const decoded = decodeJwt(`Bearer ${header}.${payload}.`);
    expect(isDecoded(decoded)).toBe(false);
    const ok = decodeJwt(`${header}.${payload}.sig`);
    expect(isDecoded(ok) && ok.payload.name).toBe("café");
  });

  it("rejects two segments and detects JWE", () => {
    expect(decodeJwt("a.b")).toMatchObject({ kind: "malformed" });
    expect(decodeJwt("a.b.c.d.e")).toMatchObject({ kind: "jwe" });
    const decoded = decodeJwt(token);
    expect(isDecoded(decoded) && decoded.header.alg).toBe("HS256");
    if (isDecoded(decoded)) {
      const rows = claimRows(decoded.payload, Date.parse("2026-10-16T00:00:00Z"));
      expect(rows.find((row) => row.name === "exp")?.value).toContain("Valid for");
    }
  });

  it("names the segment that is not JSON and keeps a valid header", () => {
    const header = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
    const decoded = decodeJwt(`${header}.eyJ.sig`);
    expect(decoded).toMatchObject({ kind: "json", segment: 2 });
    if (!isDecoded(decoded)) {
      expect(decoded.error).toMatch(/Segment 2 isn’t valid JSON/);
      expect(decoded.partialHeader?.alg).toBe("HS256");
    }
  });

  it("reads the benchline example in UTC", () => {
    const decoded = decodeJwt(EXAMPLE_TOKEN);
    expect(isDecoded(decoded) && decoded.payload.iss).toBe("benchline");
    const now = Date.parse("2026-10-16T00:00:00Z");
    if (isDecoded(decoded)) {
      const exp = claimViews(decoded.payload, now).find((row) => row.name === "exp");
      expect(exp?.sub).toBe("17 Mar 2030, 17:46 UTC");
      expect(exp?.hint).toBe("in 3 years");
      expect(formatUtc(new Date(1700000000 * 1000))).toBe("14 Nov 2023, 22:13 UTC");
    }
  });
});

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
