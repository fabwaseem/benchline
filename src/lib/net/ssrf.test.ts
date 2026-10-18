import { describe, expect, it } from "vitest";
import { isBlockedIp, parseOutboundUrl, parsePublicHttpUrl, PublicUrlError } from "@/lib/net/ssrf";

const blocked = [
  "127.0.0.1",
  "127.1",
  "2130706433",
  "0x7f000001",
  "0177.0.0.1",
  "0x7f.1",
  "0177.1",
  "0.0.0.0",
  "0.1.2.3",
  "10.0.0.1",
  "172.16.0.1",
  "172.31.255.255",
  "192.168.1.1",
  "169.254.169.254",
  "169.254.1.1",
  "100.64.0.1",
  "100.127.255.255",
  "224.0.0.1",
  "240.0.0.1",
  "255.255.255.255",
  "192.0.2.1",
  "198.51.100.1",
  "203.0.113.1",
  "::1",
  "::",
  "fc00::1",
  "fd00::1",
  "fe80::1",
  "ff02::1",
  "2001:db8::1",
  "::ffff:127.0.0.1",
  "::ffff:7f00:1",
  "::ffff:10.0.0.1",
  "::ffff:a00:1",
  "::ffff:169.254.169.254",
  "::ffff:a9fe:a9fe",
  "2002:7f00:1::",
  "64:ff9b::7f00:1",
];

describe("isBlockedIp", () => {
  it("blocks loopback, private, link-local, cgnat, and reserved addresses", () => {
    for (const ip of blocked) expect(isBlockedIp(ip), ip).toBe(true);
  });

  it("allows public addresses", () => {
    expect(isBlockedIp("1.1.1.1")).toBe(false);
    expect(isBlockedIp("8.8.8.8")).toBe(false);
    expect(isBlockedIp("172.32.0.1")).toBe(false);
    expect(isBlockedIp("100.128.0.1")).toBe(false);
    expect(isBlockedIp("11.0.0.1")).toBe(false);
    expect(isBlockedIp("2606:4700:4700::1111")).toBe(false);
    expect(isBlockedIp("::ffff:1.1.1.1")).toBe(false);
    expect(isBlockedIp("::ffff:8.8.8.8")).toBe(false);
    expect(isBlockedIp("2002:0808:0808::")).toBe(false);
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
    expect(() => parsePublicHttpUrl("http://127.0.0.1:3000")).toThrow(PublicUrlError);
    expect(() => parsePublicHttpUrl("http://localhost/admin")).toThrow(PublicUrlError);
    expect(() => parsePublicHttpUrl("file:///etc/passwd")).toThrow(PublicUrlError);
  });
});

describe("parseOutboundUrl", () => {
  it("rejects disguised loopback, private, and internal names", () => {
    const urls = [
      "http://127.0.0.1:3000/",
      "http://10.0.0.1/",
      "http://coolify:8080/",
      "http://coolify./",
      "http://localhost/",
      "http://localhost./",
      "http://[::1]/",
      "http://[::]/",
      "http://0.0.0.0/",
      "http://2130706433/",
      "http://0x7f000001/",
      "http://0177.0.0.1/",
      "http://127.1/",
      "http://127。0。0。1/",
      "http://①②⑦.0.0.1/",
      "http://host.docker.internal/",
      "http://gateway.docker.internal/health",
      "http://169.254.169.254/latest/meta-data/",
      "http://172.16.5.5/",
      "http://192.168.0.4/",
      "http://100.64.1.1/",
      "http://224.0.0.1/",
      "http://255.255.255.255/",
      "http://[fc00::1]/",
      "http://[fd12:3456::1]/",
      "http://[fe80::1]/",
      "http://[::ffff:127.0.0.1]/",
      "http://[::ffff:7f00:1]/",
      "http://[::ffff:10.0.0.1]/",
      "http://[::ffff:169.254.169.254]/",
      "http://metadata.google.internal/computeMetadata/v1/",
      "http://printer.local/",
      "http://db.internal/",
      "ftp://example.com/",
      "file:///etc/passwd",
      "gopher://example.com/",
      "http://user:pass@1.1.1.1/",
    ];
    for (const input of urls) {
      expect(() => parseOutboundUrl(input), input).toThrow(PublicUrlError);
    }
  });

  it("rejects a public address on port 8000 and allows https by default", () => {
    expect(() => parseOutboundUrl("http://1.2.3.4:8000")).toThrow(/Only ports 80 and 443 are allowed/);
    expect(parseOutboundUrl("https://example.com").href).toBe("https://example.com/");
  });

  it("allows a non-web port only when that port is listed", () => {
    const url = parseOutboundUrl("https://example.com:8443/graphql", { allowedPorts: [8443] });
    expect(url.port).toBe("8443");
    expect(() => parseOutboundUrl("http://1.2.3.4:8000", { allowedPorts: [8443] })).toThrow(/That port is not allowed/);
  });

  it("accepts public addresses and ws schemes when asked", () => {
    expect(parseOutboundUrl("https://1.1.1.1/path").hostname).toBe("1.1.1.1");
    expect(parseOutboundUrl("https://[2606:4700:4700::1111]/").hostname).toContain("2606:4700:4700");
    const socket = parseOutboundUrl("wss://echo.example.com/chat", { schemes: ["ws", "wss"] });
    expect(socket.protocol).toBe("wss:");
    expect(() => parseOutboundUrl("ws://127.0.0.1:8080", { schemes: ["ws", "wss"] })).toThrow(PublicUrlError);
    expect(() => parseOutboundUrl("ws://coolify:8080", { schemes: ["ws", "wss"] })).toThrow(PublicUrlError);
    expect(() => parseOutboundUrl("http://example.com", { schemes: ["ws", "wss"] })).toThrow(/ws and wss/);
  });
});
