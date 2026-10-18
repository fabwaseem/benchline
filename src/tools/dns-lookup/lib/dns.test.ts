import { describe, expect, it } from "vitest";
import { decodeTxt, dmarcName, parseDmarc, parseDoh, parseSpf, validateName } from "@/tools/dns-lookup/lib/dns";

describe("validateName", () => {
  it("accepts a public hostname and rejects private names", () => {
    expect(validateName("Example.COM.")).toEqual({ name: "example.com" });
    expect(validateName("localhost")).toMatchObject({ error: expect.stringMatching(/public/) });
    expect(validateName("printer.local")).toMatchObject({ error: expect.stringMatching(/public/) });
    expect(validateName("https://example.com")).toMatchObject({ error: expect.stringMatching(/hostname/) });
  });
});

describe("DNS JSON", () => {
  it("parses answers and TXT quotes", () => {
    const parsed = parseDoh(
      JSON.stringify({ Status: 0, Answer: [{ name: "example.com.", type: 16, TTL: 60, data: '"v=spf1" " -all"' }] }),
      "TXT",
    );
    expect(parsed).toMatchObject({ rcode: "NOERROR", records: [{ type: "TXT", data: "v=spf1 -all", ttl: 60 }] });
    expect(decodeTxt('"a" "b"')).toBe("ab");
  });

  it("parses SPF and DMARC", () => {
    const spf = parseSpf([{ type: "TXT", name: "example.com", ttl: 1, data: "v=spf1 ip4:192.0.2.0/24 include:_spf.example.com -all" }]);
    expect(spf?.all).toBe("-");
    expect(spf?.mechanisms.map((item) => item.mechanism)).toEqual(["ip4", "include", "all"]);
    const dmarc = parseDmarc([{ type: "TXT", name: dmarcName("example.com"), ttl: 1, data: "v=DMARC1; p=reject; rua=mailto:d@example.com; pct=100" }]);
    expect(dmarc).toMatchObject({ policy: "reject", rua: "mailto:d@example.com", pct: "100" });
  });
});
