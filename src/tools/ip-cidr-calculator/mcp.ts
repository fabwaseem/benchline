import { z } from "zod";
import type { BenchTool } from "@/lib/mcp/types";
import { calculateCidr } from "@/tools/ip-cidr-calculator/lib/cidr";

const summary = z.object({
  version: z.union([z.literal(4), z.literal(6)]),
  input: z.string(),
  network: z.string(),
  prefix: z.number(),
  netmask: z.string(),
  wildcard: z.string(),
  broadcast: z.string().nullable(),
  firstHost: z.string(),
  lastHost: z.string(),
  addressCount: z.string(),
  usableHosts: z.string(),
});

export const inputSchema = z.object({
  cidr: z.string().describe("IPv4 or IPv6 CIDR, such as 192.168.1.0/24 or 2001:db8::/32. A dotted mask may follow the address."),
  contains: z.string().optional().describe("Address to test for membership."),
  splitPrefix: z.number().int().optional().describe("Longer prefix to split into, at most 256 networks."),
  merge: z.array(z.string()).max(64).optional().describe("Extra CIDRs to aggregate with cidr."),
});

export const outputSchema = z.object({
  summary,
  contains: z.boolean().nullable(),
  containsDetail: z.string(),
  split: z.array(z.string()),
  splitCount: z.string(),
  merged: z.array(z.string()),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const result = calculateCidr(parsed);
  if ("error" in result) throw new Error(result.error);
  return outputSchema.parse(result);
}

export const tool: BenchTool = {
  slug: "ip-cidr-calculator",
  name: "calculate_cidr",
  title: "Calculate a CIDR block",
  description: "Return the network, broadcast, host range, and host count for an IPv4 or IPv6 CIDR. Optionally test whether an address is inside it, split it, or merge it with other CIDRs.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
