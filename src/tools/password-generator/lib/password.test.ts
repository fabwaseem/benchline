import { describe, expect, it } from "vitest";
import { EFF_SHORT_WORDS } from "@/tools/password-generator/lib/words";
import { generatePassword, generatePassphrases, generatePasswords, passwordStrength, type PasswordOptions, type RandomUint32 } from "@/tools/password-generator/lib/password";

const options: PasswordOptions = {
  length: 12,
  lowercase: true,
  uppercase: true,
  digits: true,
  symbols: false,
  excludeAmbiguous: true,
};

function sequence(): RandomUint32 {
  let value = 1;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value;
  };
}

describe("password generator", () => {
  it("draws from the selected sets with rejection-sampled indexes", () => {
    const next = sequence();
    const password = generatePassword(options, next);
    expect(typeof password).toBe("string");
    if (typeof password !== "string") return;
    expect(password).toHaveLength(12);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[2-9]/);
    expect(password).not.toMatch(/[0Ol1I]/);
    const again = generatePassword(options, next);
    expect(again).not.toBe(password);
  });

  it("estimates entropy and builds a passphrase from the public-domain wordlist", () => {
    const strength = passwordStrength(options);
    expect("error" in strength).toBe(false);
    if ("error" in strength) return;
    expect(strength.bits).toBeGreaterThan(64);
    expect(strength.label).toBe("Strong");
    const weak = passwordStrength({ ...options, length: 4, uppercase: false, digits: false, symbols: false });
    expect("error" in weak).toBe(false);
    if ("error" in weak) return;
    expect(weak.label).toBe("Weak");
    expect(EFF_SHORT_WORDS).toHaveLength(1296);
    const phrases = generatePassphrases({ words: 4, separator: "-", capitalize: true, digit: true }, 2, sequence());
    expect("error" in phrases).toBe(false);
    if ("error" in phrases) return;
    expect(phrases.phrases).toHaveLength(2);
    expect(phrases.phrases[0]?.split("-")).toHaveLength(5);
    expect(phrases.strength.bits).toBeGreaterThan(40);
    expect(generatePasswords({ ...options, lowercase: false, uppercase: false, digits: false }, 1)).toEqual({
      error: "Pick at least one character set.",
    });
  });
});
