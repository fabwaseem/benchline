import { z } from "zod";
import { closeCodeName, parseWebSocketUrl } from "@/tools/websocket-tester/lib/websocket";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  url: z.string().min(1).max(2000),
  explainCloseCode: z.number().int().min(1000).max(4999).optional(),
});

export const outputSchema = z.object({
  valid: z.boolean(),
  protocol: z.enum(["ws", "wss"]).optional(),
  secure: z.boolean().optional(),
  host: z.string().optional(),
  port: z.number().int().optional(),
  path: z.string().optional(),
  error: z.string().optional(),
  closeCode: z.string().optional(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const checked = parseWebSocketUrl(parsed.url);
  return outputSchema.parse({
    ...checked,
    ...(parsed.explainCloseCode !== undefined ? { closeCode: closeCodeName(parsed.explainCloseCode) } : {}),
  });
}

export const tool: BenchTool = {
  slug: "websocket-tester",
  name: "validate_websocket_url",
  title: "Validate a WebSocket URL",
  description:
    "Validate and parse a ws:// or wss:// URL into its components, and optionally decode a WebSocket close code.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
