import { describe, expect, it } from "vitest";
import { generateUuids, inspectUuid, uuidV4, uuidV7 } from "@/tools/uuid-generator/lib/uuid";

const fixed = (size: number) => new Uint8Array(size).fill(0xab);

describe("uuid generator", () => {
  it("sets the version and variant bits for v4 and v7", () => {
    expect(uuidV4(fixed)).toBe("abababab-abab-4bab-abab-abababababab");
    expect(uuidV7(1_700_000_000_000, fixed)).toBe("018bcfe5-6800-7bab-abab-abababababab");
  });

  it("generates a bounded batch and reads a v7 timestamp", () => {
    const batch = generateUuids("v7", 3, () => 1_700_000_000_000, fixed);
    expect(Array.isArray(batch)).toBe(true);
    if (!Array.isArray(batch)) return;
    expect(batch).toHaveLength(3);
    expect(new Set(batch).size).toBe(3);
    const info = inspectUuid(batch[0] ?? "");
    expect("error" in info).toBe(false);
    if ("error" in info) return;
    expect(info.version).toBe(7);
    expect(info.variant).toBe("RFC 4122");
    expect(info.timestamp).toBe("2023-11-14T22:13:20.000Z");
    expect(generateUuids("v4", 0)).toHaveProperty("error");
    expect(inspectUuid("not-a-uuid")).toHaveProperty("error");
  });
});
