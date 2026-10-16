import { describe, expect, it } from "vitest";
import { claimRows, decodeJwt, isDecoded } from "@/tools/jwt-decoder/lib/jwt";

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
});

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
