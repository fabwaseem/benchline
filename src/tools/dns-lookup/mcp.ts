import { z } from "zod";
import type { BenchTool } from "@/lib/mcp/types";
import { recordTypes, resolvers } from "@/tools/dns-lookup/lib/dns";
import { lookupDns } from "@/tools/dns-lookup/remote";

const record = z.object({ type: z.string(), name: z.string(), ttl: z.number(), data: z.string() });
const mechanism = z.object({ qualifier: z.string(), mechanism: z.string(), value: z.string() });

export const inputSchema = z.object({
  name: z.string().describe("Public hostname, such as example.com. Private names are refused."),
  types: z.array(z.enum(recordTypes)).default(["A", "AAAA", "MX", "TXT", "CNAME", "CAA"]),
  resolver: z.enum(resolvers).default("cloudflare"),
  mail: z.boolean().default(true).describe("Also fetch the _dmarc TXT record and parse SPF."),
});

export const outputSchema = z.object({
  name: z.string(),
  resolver: z.enum(resolvers),
  records: z.array(record),
  queries: z.array(z.object({ type: z.enum(recordTypes), rcode: z.string() })),
  spf: z.object({ raw: z.string(), all: z.string(), mechanisms: z.array(mechanism) }).nullable(),
  dmarc: z.object({ raw: z.string(), policy: z.string(), subdomainPolicy: z.string(), rua: z.string(), pct: z.string() }).nullable(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  return outputSchema.parse(await lookupDns(parsed));
}

export const tool: BenchTool = {
  slug: "dns-lookup",
  name: "lookup_dns",
  title: "Look up DNS records",
  description: "Query A, AAAA, MX, TXT, CNAME, and CAA for a public hostname over DNS-over-HTTPS, and parse SPF and DMARC. Private names are refused. The resolver is Cloudflare or Google.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
