import { z } from "zod";
import type { BenchTool } from "@/lib/mcp/types";
import { checkSsl } from "@/tools/ssl-checker/remote";

const check = z.object({ level: z.enum(["pass", "warn", "fail", "info"]), label: z.string(), detail: z.string() });

export const inputSchema = z.object({
  host: z.string().describe("Public hostname or https URL. Only port 443 is contacted. Private addresses are refused."),
});

export const outputSchema = z.object({
  host: z.string(),
  authorized: z.boolean(),
  protocol: z.string(),
  authorizationError: z.string(),
  subject: z.string(),
  commonName: z.string(),
  issuer: z.string(),
  validFrom: z.string(),
  validTo: z.string(),
  sans: z.array(z.string()),
  fingerprint: z.string(),
  serial: z.string(),
  bits: z.number().nullable(),
  daysRemaining: z.number().nullable(),
  grade: z.enum(["A", "B", "C", "D", "F"]),
  checks: z.array(check),
  chain: z.array(z.object({ subject: z.string(), issuer: z.string(), validTo: z.string() })),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  return outputSchema.parse(await checkSsl(parsed.host));
}

export const tool: BenchTool = {
  slug: "ssl-checker",
  name: "check_ssl",
  title: "Check a TLS certificate",
  description: "Connect to a public host on port 443 and report certificate expiry, subject alternative names, protocol, and chain. Private addresses are refused. The handshake times out after 8 seconds.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
