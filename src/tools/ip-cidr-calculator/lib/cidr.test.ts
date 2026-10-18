import { describe, expect, it } from "vitest";
import { calculateCidr, mergeNetworks } from "@/tools/ip-cidr-calculator/lib/cidr";

describe("calculateCidr", () => {
  it("summarizes an IPv4 block, including host bits", () => {
    const result = calculateCidr({ cidr: "192.168.1.10/24", contains: "192.168.1.50" });
    expect(result).toMatchObject({
      summary: {
        version: 4,
        network: "192.168.1.0/24",
        prefix: 24,
        netmask: "255.255.255.0",
        wildcard: "0.0.0.255",
        broadcast: "192.168.1.255",
        firstHost: "192.168.1.1",
        lastHost: "192.168.1.254",
        addressCount: "256",
        usableHosts: "254",
      },
      contains: true,
    });
  });

  it("accepts a dotted mask and treats /31 as two usable addresses", () => {
    const masked = calculateCidr({ cidr: "10.0.0.9 255.255.255.0" });
    expect(masked).toMatchObject({ summary: { network: "10.0.0.0/24", netmask: "255.255.255.0" } });
    const point = calculateCidr({ cidr: "192.0.2.0/31" });
    expect(point).toMatchObject({
      summary: { firstHost: "192.0.2.0", lastHost: "192.0.2.1", usableHosts: "2", broadcast: "192.0.2.1" },
    });
  });

  it("splits, merges, and checks IPv6", () => {
    const split = calculateCidr({ cidr: "192.168.0.0/24", splitPrefix: 26 });
    expect(split).toMatchObject({ splitCount: "4" });
    if ("error" in split) return;
    expect(split.split).toEqual(["192.168.0.0/26", "192.168.0.64/26", "192.168.0.128/26", "192.168.0.192/26"]);
    expect(mergeNetworks(["192.168.0.0/25", "192.168.0.128/25"])).toEqual(["192.168.0.0/24"]);
    const v6 = calculateCidr({ cidr: "2001:db8:1::1/32", contains: "2001:db8::1" });
    expect(v6).toMatchObject({ summary: { version: 6, network: "2001:db8::/32", broadcast: null }, contains: true });
    const outside = calculateCidr({ cidr: "192.168.1.0/24", contains: "10.0.0.1" });
    expect(outside).toMatchObject({ contains: false });
  });

  it("refuses a split that would emit more than 256 networks", () => {
    expect(calculateCidr({ cidr: "10.0.0.0/8", splitPrefix: 24 })).toMatchObject({ error: expect.stringMatching(/256/) });
  });
});
