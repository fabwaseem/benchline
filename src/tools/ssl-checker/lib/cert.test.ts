import { describe, expect, it } from "vitest";
import { assessCertificate, hostMatches, parseSanList } from "@/tools/ssl-checker/lib/cert";

const fields = {
  subject: "example.com",
  commonName: "example.com",
  issuer: "Example CA",
  validFrom: "2026-01-01T00:00:00.000Z",
  validTo: "2027-01-01T00:00:00.000Z",
  sans: ["example.com", "*.example.com"],
  fingerprint: "AA",
  serial: "01",
  bits: 256,
};

describe("assessCertificate", () => {
  it("counts days and matches wildcard names", () => {
    const now = Date.parse("2026-10-18T00:00:00.000Z");
    const assessed = assessCertificate(fields, now, { authorized: true, protocol: "TLSv1.3", hostname: "www.example.com" });
    expect(assessed.daysRemaining).toBe(75);
    expect(assessed.grade).toBe("A");
    expect(hostMatches("www.example.com", "*.example.com")).toBe(true);
    expect(hostMatches("a.b.example.com", "*.example.com")).toBe(false);
    expect(parseSanList("DNS:example.com, DNS:www.example.com")).toEqual(["example.com", "www.example.com"]);
  });

  it("fails a certificate that has already expired", () => {
    const assessed = assessCertificate({ ...fields, validTo: "2020-01-01T00:00:00.000Z" }, Date.parse("2026-10-18T00:00:00.000Z"), { authorized: true, protocol: "TLSv1.3" });
    expect(assessed.grade).toBe("D");
    expect(assessed.daysRemaining).toBeLessThan(0);
  });
});
