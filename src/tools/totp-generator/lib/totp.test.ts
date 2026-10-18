import { describe, expect, it } from "vitest";
import {
  buildOtpAuthUri,
  decodeBase32,
  generateHotp,
  generateTotp,
  groupCode,
  hotpCode,
  normalizeSecret,
  parseOtpAuthUri,
  totpCode,
} from "@/tools/totp-generator/lib/totp";

const RFC4226_SECRET = "12345678901234567890";
const RFC4226_HOTP = ["755224", "287082", "359152", "969429", "338314", "254676", "287922", "162583", "399871", "520489"];

// RFC 6238 Appendix B secrets (ASCII) and expected 8-digit codes.
const SHA1_SECRET = "12345678901234567890";
const SHA256_SECRET = "12345678901234567890123456789012";
const SHA512_SECRET = "1234567890123456789012345678901234567890123456789012345678901234";
const RFC6238_TIMES = [59, 1111111109, 1111111111, 1234567890, 2000000000, 20000000000];
const RFC6238_SHA1 = ["94287082", "07081804", "14050471", "89005924", "69279037", "65353130"];
const RFC6238_SHA256 = ["46119246", "68084774", "67062674", "91819424", "90698825", "77737706"];
const RFC6238_SHA512 = ["90693936", "25091201", "99943326", "93441116", "38618901", "47863826"];

function asciiBytes(text: string): Uint8Array<ArrayBuffer> {
  const encoded = new TextEncoder().encode(text);
  const out = new Uint8Array(encoded.length);
  out.set(encoded);
  return out;
}

describe("base32", () => {
  it("decodes a known secret and tolerates lowercase and spaces", () => {
    const key = decodeBase32("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
    expect(key).toEqual(asciiBytes(RFC4226_SECRET));
    const messy = decodeBase32("gezdgnbv gy3tqojq gezdgnbv gy3tqojq");
    expect(messy).toEqual(asciiBytes(RFC4226_SECRET));
  });

  it("rejects invalid input", () => {
    expect(decodeBase32("")).toEqual({ error: "The secret is empty." });
    expect(decodeBase32("!!!!")).toMatchObject({ error: expect.stringContaining("invalid base32") });
    expect(normalizeSecret("ab cd-ef")).toBe("ABCDEF");
  });
});

describe("HOTP (RFC 4226)", () => {
  it("matches the RFC 4226 test vectors", async () => {
    const key = asciiBytes(RFC4226_SECRET);
    for (const [index, expected] of RFC4226_HOTP.entries()) {
      const code = await hotpCode(key, index, { digits: 6, algorithm: "SHA1" });
      expect(code).toBe(expected);
    }
  });

  it("validates its inputs", async () => {
    const key = asciiBytes(RFC4226_SECRET);
    expect(await hotpCode(key, -1, { digits: 6, algorithm: "SHA1" })).toMatchObject({ error: expect.stringContaining("counter") });
    expect(await hotpCode(key, 1.5, { digits: 6, algorithm: "SHA1" })).toMatchObject({ error: expect.stringContaining("counter") });
    expect(await generateHotp("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", 0, { digits: 6, algorithm: "SHA1" })).toBe("755224");
    expect(await generateHotp("not-valid!!", 0, { digits: 6, algorithm: "SHA1" })).toMatchObject({ error: expect.any(String) });
  });
});

describe("TOTP (RFC 6238)", () => {
  it("matches the RFC 6238 Appendix B vectors", async () => {
    const cases: Array<{ secret: string; algorithm: "SHA1" | "SHA256" | "SHA512"; expected: string[] }> = [
      { secret: SHA1_SECRET, algorithm: "SHA1", expected: RFC6238_SHA1 },
      { secret: SHA256_SECRET, algorithm: "SHA256", expected: RFC6238_SHA256 },
      { secret: SHA512_SECRET, algorithm: "SHA512", expected: RFC6238_SHA512 },
    ];
    for (const { secret, algorithm, expected } of cases) {
      for (const [index, time] of RFC6238_TIMES.entries()) {
        const result = await totpCode(asciiBytes(secret), { digits: 8, period: 30, algorithm }, time * 1000);
        expect(result).toMatchObject({ code: expected[index] });
      }
    }
  });

  it("reports the seconds remaining in the period", async () => {
    const result = await totpCode(asciiBytes(SHA1_SECRET), { digits: 6, period: 30, algorithm: "SHA1" }, 59_000);
    expect(result).toMatchObject({ secondsRemaining: 1, period: 30 });
    if ("error" in (result as object)) return;
    expect((result as { code: string }).code).toHaveLength(6);
  });

  it("validates digits, period, and algorithm", async () => {
    const key = asciiBytes(SHA1_SECRET);
    expect(await totpCode(key, { digits: 7 as 6, period: 30, algorithm: "SHA1" })).toMatchObject({ error: expect.stringContaining("Digits") });
    expect(await totpCode(key, { digits: 6, period: 0, algorithm: "SHA1" })).toMatchObject({ error: expect.stringContaining("period") });
    expect(await generateTotp("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", { digits: 6, period: 30, algorithm: "SHA1" }, 59_000)).toMatchObject({
      code: expect.any(String),
    });
  });
});

describe("otpauth URIs", () => {
  it("round-trips an account", () => {
    const account = {
      label: "alice@example.com",
      issuer: "Example",
      secret: "JBSWY3DPEHPK3PXP",
      digits: 6 as const,
      period: 30,
      algorithm: "SHA1" as const,
      mode: "totp" as const,
      counter: 0,
    };
    const uri = buildOtpAuthUri(account);
    expect(uri.startsWith("otpauth://totp/")).toBe(true);
    const parsed = parseOtpAuthUri(uri);
    expect(parsed).toMatchObject({ label: "alice@example.com", issuer: "Example", secret: "JBSWY3DPEHPK3PXP", mode: "totp" });
  });

  it("round-trips an HOTP account with a counter", () => {
    const uri = buildOtpAuthUri({
      label: "backup",
      issuer: "",
      secret: "JBSWY3DPEHPK3PXP",
      digits: 8,
      period: 30,
      algorithm: "SHA256",
      mode: "hotp",
      counter: 41,
    });
    expect(uri).toContain("counter=41");
    expect(parseOtpAuthUri(uri)).toMatchObject({ mode: "hotp", counter: 41, digits: 8, algorithm: "SHA256" });
  });

  it("rejects malformed URIs", () => {
    expect(parseOtpAuthUri("https://example.com")).toMatchObject({ error: expect.stringContaining("otpauth://") });
    expect(parseOtpAuthUri("otpauth://totp/label?secret=!!!")).toMatchObject({ error: expect.any(String) });
    expect(parseOtpAuthUri("otpauth://totp/?secret=JBSWY3DPEHPK3PXP")).toMatchObject({ error: expect.stringContaining("label") });
  });
});

describe("groupCode", () => {
  it("groups six-digit codes for readability", () => {
    expect(groupCode("123456")).toBe("123 456");
    expect(groupCode("12345678")).toBe("12345678");
  });
});
