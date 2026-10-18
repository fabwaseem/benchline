import { z } from "zod";
import type { BenchTool } from "@/lib/mcp/types";
import { documentFor, lintPolicy, nextConfigSnippet, sourceDirectives, type CspDraft, type SourceDirective } from "@/tools/csp-generator/lib/csp";

export const inputSchema = z.object({
  policy: z.string().optional().describe("An existing Content-Security-Policy value to lint. When set, directive fields are ignored."),
  sources: z.record(z.enum(sourceDirectives), z.string()).optional(),
  upgradeInsecureRequests: z.boolean().default(true),
  blockAllMixedContent: z.boolean().default(false),
});

export const outputSchema = z.object({
  policy: z.string(),
  header: z.string(),
  nextConfig: z.string(),
  checks: z.array(z.object({ level: z.enum(["pass", "warn", "fail", "info"]), label: z.string(), detail: z.string() })),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  if (parsed.policy?.trim()) {
    const policy = parsed.policy.trim();
    return outputSchema.parse({
      policy,
      header: `Content-Security-Policy: ${policy}`,
      nextConfig: nextConfigSnippet(policy),
      checks: lintPolicy(policy),
    });
  }
  const draft: CspDraft = {
    sources: (parsed.sources ?? {}) as Partial<Record<SourceDirective, string>>,
    upgradeInsecureRequests: parsed.upgradeInsecureRequests,
    blockAllMixedContent: parsed.blockAllMixedContent,
  };
  return outputSchema.parse(documentFor(draft));
}

export const tool: BenchTool = {
  slug: "csp-generator",
  name: "build_csp",
  title: "Build a Content-Security-Policy",
  description: "Build a Content-Security-Policy from directives, or lint an existing policy. Returns the header line, a Next.js headers() snippet, and warnings for unsafe sources.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
