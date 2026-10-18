import { describe, expect, it } from "vitest";
import { closeCodeName, formatFrameTime, makeFrame, parseWebSocketUrl } from "./websocket";

describe("parseWebSocketUrl", () => {
  it("parses a wss URL with defaults", () => {
    const result = parseWebSocketUrl("wss://echo.example.com/chat");
    expect(result).toMatchObject({ valid: true, protocol: "wss", secure: true, host: "echo.example.com", port: 443, path: "/chat" });
  });

  it("parses ws with an explicit port and query", () => {
    const result = parseWebSocketUrl("ws://localhost:8080/socket?token=abc");
    expect(result).toMatchObject({ valid: true, protocol: "ws", secure: false, host: "localhost", port: 8080, path: "/socket?token=abc" });
  });

  it("rejects http URLs with a helpful message", () => {
    const result = parseWebSocketUrl("https://example.com");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("ws://");
  });

  it("rejects garbage", () => {
    expect(parseWebSocketUrl("not a url").valid).toBe(false);
    expect(parseWebSocketUrl("").valid).toBe(false);
  });
});

describe("closeCodeName", () => {
  it("names standard codes", () => {
    expect(closeCodeName(1000)).toBe("Normal closure");
    expect(closeCodeName(1006)).toBe("Abnormal closure");
  });

  it("labels application codes", () => {
    expect(closeCodeName(4000)).toBe("Application-defined");
    expect(closeCodeName(9999)).toBe("Unknown code");
  });
});

describe("makeFrame", () => {
  it("creates unique frames with timestamps", () => {
    const a = makeFrame("out", "hi");
    const b = makeFrame("in", "hello");
    expect(a.id).not.toBe(b.id);
    expect(a.direction).toBe("out");
    expect(typeof a.at).toBe("number");
  });
});

describe("formatFrameTime", () => {
  it("formats milliseconds", () => {
    const text = formatFrameTime(new Date(2026, 0, 2, 3, 4, 5, 6).getTime());
    expect(text).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/);
  });
});
