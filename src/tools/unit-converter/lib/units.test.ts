import { describe, expect, it } from "vitest";
import { convertUnits } from "@/tools/unit-converter/lib/units";

describe("unit converter", () => {
  it("converts metric length exactly", () => {
    const result = convertUnits("length", "m", "cm", "1", 2);
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.result).toBe("100.00");
    expect(result.rows.find((row) => row.id === "km")?.value).toBe("0.00");
  });

  it("converts temperature through the affine scale", () => {
    expect(convertUnits("temperature", "C", "F", "0", 1)).toMatchObject({ result: "32.0" });
    expect(convertUnits("temperature", "C", "F", "100", 0)).toMatchObject({ result: "212" });
    expect(convertUnits("temperature", "K", "C", "0", 2)).toMatchObject({ result: "-273.15" });
  });

  it("keeps decimal and binary data units apart", () => {
    const decimal = convertUnits("data-decimal", "MB", "kB", "1", 0);
    const binary = convertUnits("data-binary", "MiB", "KiB", "1", 0);
    expect(decimal).toMatchObject({ result: "1000" });
    expect(binary).toMatchObject({ result: "1024" });
    expect(convertUnits("data-decimal", "kB", "bit", "1", 0)).toMatchObject({ result: "8000" });
    expect(convertUnits("data-binary", "KiB", "B", "1.5", 0)).toMatchObject({ result: "1536" });
  });

  it("rejects a negative file size and an unknown unit", () => {
    expect("error" in convertUnits("data-binary", "MiB", "KiB", "-1", 2)).toBe(true);
    expect("error" in convertUnits("length", "m", "lb", "1", 2)).toBe(true);
    expect("error" in convertUnits("mass", "kg", "lb", "1", 13)).toBe(true);
  });
});