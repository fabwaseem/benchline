import { describe, expect, it } from "vitest";
import {
  applyBitwise,
  asciiOf,
  bitAt,
  evaluateExpression,
  formatBase,
  groupDigits,
  parseBigInt,
  toggleBit,
  toSigned,
  toUnsigned,
} from "@/tools/programmer-calculator/lib/programmer";

describe("programmer calculator", () => {
  it("parses prefixed and decimal literals", () => {
    expect(parseBigInt("0xFF")).toBe(BigInt("255"));
    expect(parseBigInt("0b1010")).toBe(BigInt("10"));
    expect(parseBigInt("0o17")).toBe(BigInt("15"));
    expect(parseBigInt("42")).toBe(BigInt("42"));
    expect(parseBigInt("-0x10")).toBe(-BigInt("16"));
    expect(parseBigInt("1_000")).toBe(BigInt("1000"));
    expect(parseBigInt("0xZZ")).toMatchObject({ error: expect.stringContaining("base-16") });
    expect(parseBigInt("")).toMatchObject({ error: expect.any(String) });
    expect(parseBigInt("0b102")).toMatchObject({ error: expect.stringContaining("base-2") });
  });

  it("formats bases and groups digits", () => {
    expect(formatBase(BigInt("255"), 16)).toBe("ff");
    expect(formatBase(BigInt("255"), 2)).toBe("11111111");
    expect(formatBase(-BigInt("255"), 16)).toBe("-ff");
    expect(formatBase(BigInt("0"), 2)).toBe("0");
    expect(groupDigits("11111111", 2)).toBe("1111 1111");
    expect(groupDigits("ff", 16)).toBe("ff");
    expect(groupDigits("777", 8)).toBe("777");
    expect(groupDigits("1234567", 8)).toBe("1 234 567");
  });

  it("interprets signed and unsigned widths", () => {
    expect(toUnsigned(-BigInt("1"), 8)).toBe(BigInt("255"));
    expect(toUnsigned(BigInt("256"), 8)).toBe(BigInt("0"));
    expect(toSigned(BigInt("255"), 8)).toBe(-BigInt("1"));
    expect(toSigned(BigInt("127"), 8)).toBe(BigInt("127"));
    expect(toSigned(BigInt("0xFFFFFFFFFFFFFFFF"), 64)).toBe(-BigInt("1"));
    expect(toSigned(BigInt("0x7FFFFFFFFFFFFFFF"), 64)).toBe(BigInt("9223372036854775807"));
    expect(toUnsigned(-BigInt("1"), 64)).toBe(BigInt("18446744073709551615"));
  });

  it("reads and toggles bits", () => {
    expect(bitAt(BigInt("0b1010"), 1)).toBe(1);
    expect(bitAt(BigInt("0b1010"), 0)).toBe(0);
    expect(toggleBit(BigInt("0b1010"), 0)).toBe(BigInt("0b1011"));
    expect(toggleBit(BigInt("0b1011"), 0)).toBe(BigInt("0b1010"));
    expect(toggleBit(BigInt("255"), 7, 8)).toBe(BigInt("127"));
    expect(toggleBit(BigInt("255"), 8, 8)).toBe(BigInt("255")); // bit 8 is out of the 8-bit view, masked away
  });

  it("maps ASCII", () => {
    expect(asciiOf(BigInt("65"))).toBe("A");
    expect(asciiOf(BigInt("31"))).toBeNull();
    expect(asciiOf(BigInt("128"))).toBeNull();
  });

  it("applies bitwise ops within a width", () => {
    expect(applyBitwise("and", BigInt("0b1100"), BigInt("0b1010"))).toBe(BigInt("0b1000"));
    expect(applyBitwise("or", BigInt("0b1100"), BigInt("0b1010"))).toBe(BigInt("0b1110"));
    expect(applyBitwise("xor", BigInt("0b1100"), BigInt("0b1010"))).toBe(BigInt("0b0110"));
    expect(applyBitwise("not", BigInt("0"), BigInt("0"), 8)).toBe(BigInt("255"));
    expect(applyBitwise("shl", BigInt("1"), BigInt("3"))).toBe(BigInt("8"));
    expect(applyBitwise("shr", BigInt("255"), BigInt("4"), 8)).toBe(BigInt("15"));
  });

  it("evaluates expressions with C-like precedence", () => {
    expect(evaluateExpression("2 + 3 * 4")).toBe(BigInt("14"));
    expect(evaluateExpression("(2 + 3) * 4")).toBe(BigInt("20"));
    expect(evaluateExpression("0xFF & 0x0F")).toBe(BigInt("15"));
    expect(evaluateExpression("1 << 10")).toBe(BigInt("1024"));
    expect(evaluateExpression("~0")).toBe(-BigInt("1"));
    expect(evaluateExpression("-5 + 3")).toBe(-BigInt("2"));
    expect(evaluateExpression("7 / 2")).toBe(BigInt("3"));
    expect(evaluateExpression("0b1010 | 0b0101")).toBe(BigInt("15"));
    expect(evaluateExpression("2 * 0xFFFFFFFFFFFFFFFF")).toBe(BigInt("36893488147419103230"));
  });

  it("reports expression errors", () => {
    expect(evaluateExpression("1 / 0")).toMatchObject({ error: "Division by zero." });
    expect(evaluateExpression("(1 + 2")).toMatchObject({ error: expect.stringContaining("parentheses") });
    expect(evaluateExpression("1 + ")).toMatchObject({ error: expect.any(String) });
    expect(evaluateExpression("1 $ 2")).toMatchObject({ error: expect.stringContaining("Unexpected character") });
    expect(evaluateExpression("")).toMatchObject({ error: expect.any(String) });
  });
});
