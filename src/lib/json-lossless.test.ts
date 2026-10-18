import { describe, expect, it } from "vitest";
import { jsonNumberTokenIsExact, jsonNumberTokens, parseJsonLossless, stringifyJsonLossless } from "@/lib/json-lossless";

describe("json numbers", () => {
  it("reads number tokens in the same order as JSON.parse", () => {
    const text = '{"a":1,"b":[9007199254740993,"12",0.10000000000000000001],"c":"1e2"}';
    const seen: string[] = [];
    JSON.parse(text, (_key, value: unknown, context?: { source?: string }) => {
      if (typeof value === "number" && context?.source) seen.push(context.source);
      return value;
    });
    expect(jsonNumberTokens(text)).toEqual(["1", "9007199254740993", "0.10000000000000000001"]);
    expect(seen).toEqual(jsonNumberTokens(text));
  });

  it("treats equivalent tokens as exact and lossy tokens as not", () => {
    expect(jsonNumberTokenIsExact("1.0")).toBe(true);
    expect(jsonNumberTokenIsExact("1e2")).toBe(true);
    expect(jsonNumberTokenIsExact("9007199254740992")).toBe(true);
    expect(jsonNumberTokenIsExact("9007199254740993")).toBe(false);
    expect(jsonNumberTokenIsExact("0.10000000000000000001")).toBe(false);
    expect(jsonNumberTokenIsExact("1e309")).toBe(false);
  });

  it("matches JSON.stringify except where the token would change value", () => {
    const samples = ['{"a":"b\\nc\\t\\"","u":"雪","n":1,"z":null,"t":true,"f":false,"arr":[1,2],"e":{}}', "[]", "{}", "1", '"hi"', "null"];
    for (const sample of samples) {
      for (const space of [undefined, 2, 4, "\t"] as const) {
        expect(stringifyJsonLossless(JSON.parse(sample) as unknown, space)).toBe(JSON.stringify(JSON.parse(sample) as unknown, null, space));
      }
    }
    const parsed = parseJsonLossless('{"id":9007199254740993,"ratio":0.10000000000000000001,"n":1.0}');
    expect(stringifyJsonLossless(parsed)).toBe('{"id":9007199254740993,"ratio":0.10000000000000000001,"n":1}');
  });
});
