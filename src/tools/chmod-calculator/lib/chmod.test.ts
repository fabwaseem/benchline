import { describe, expect, it } from "vitest";
import { formatMode, parseMode } from "@/tools/chmod-calculator/lib/chmod";

describe("chmod calculator", () => {
  it("turns 755 and a symbolic mode into the same command", () => {
    const fromOctal = parseMode("755", "script.sh");
    const fromSymbolic = parseMode("rwxr-xr-x", "script.sh");
    expect(fromOctal).toEqual(fromSymbolic);
    expect(fromOctal).toMatchObject({ octal: "755", symbolic: "rwxr-xr-x", command: "chmod 755 script.sh" });
  });

  it("keeps setuid, setgid, and the sticky bit", () => {
    const mode = parseMode("3755");
    expect("error" in mode).toBe(false);
    if ("error" in mode) return;
    expect(mode.symbolic).toBe("rwxr-sr-t");
    expect(mode.octal).toBe("3755");
    const roundTrip = parseMode(mode.symbolic);
    expect(roundTrip).toMatchObject({ octal: "3755", symbolic: "rwxr-sr-t" });
    const setuid = parseMode("4755");
    expect("error" in setuid).toBe(false);
    if ("error" in setuid) return;
    expect(formatMode({ ...setuid.mode, owner: { ...setuid.mode.owner, execute: false } }).symbolic).toBe("rwSr-xr-x");
  });

  it("rejects a mode that is neither octal nor symbolic", () => {
    expect(parseMode("999")).toEqual({ error: "Octal mode is 3 or 4 digits from 0 to 7." });
    expect(parseMode("rwx")).toHaveProperty("error");
  });
});