import { describe, expect, it } from "vitest";
import { isBlockedIp, parsePublicHttpUrl, PublicUrlError } from "@/lib/net/ssrf";

describe("isBlockedIp", () => {
  it("blocks loopback, private, and link-local addresses", () => {
    expect(isBlockedIp("127.0.0.1")).toBe(true);
    expect(isBlockedIp("10.1.2.3")).toBe(true);
    expect(isBlockedIp("192.168.0.4")).toBe(true);
    expect(isBlockedIp("172.16.0.1")).toBe(true);
    expect(isBlockedIp("169.254.169.254")).toBe(true);
    expect(isBlockedIp("::1")).toBe(true);
    expect(isBlockedIp("fd00::1")).toBe(true);
    expect(isBlockedIp("fe80::1")).toBe(true);
  });

  it("allows public addresses", () => {
    expect(isBlockedIp("1.1.1.1")).toBe(false);
    expect(isBlockedIp("8.8.8.8")).toBe(false);
    expect(isBlockedIp("2606:4700:4700::1111")).toBe(false);
  });
});

describe("parsePublicHttpUrl", () => {
  it("adds https and accepts public hosts", () => {
    const url = parsePublicHttpUrl("example.com/robots.txt");
    expect(url.protocol).toBe("https:");
    expect(url.hostname).toBe("example.com");
  });

  it("rejects credentials, odd ports, and private hosts", () => {
    expect(() => parsePublicHttpUrl("https://user:pass@example.com")).toThrow(PublicUrlError);
    expect(() => parsePublicHttpUrl("https://example.com:8080")).toThrow(PublicUrlError);
    expect(() => parsePublicHttpUrl("http://127.0.0.1")).toThrow(PublicUrlError);
    expect(() => parsePublicHttpUrl("http://localhost/admin")).toThrow(PublicUrlError);
    expect(() => parsePublicHttpUrl("file:///etc/passwd")).toThrow(PublicUrlError);
  });
});
