import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";
import { hostnameFromHost, LEGACY_HOST } from "@/lib/net/legacy-host";
import { requestContext, type RequestContext } from "@/lib/analytics/context";
import { analyticsIp } from "@/lib/analytics/ip";
import { sessionKey } from "@/lib/analytics/hash";
import { recordRun } from "@/lib/analytics/record";
import { cleanLabel, cleanProtocol } from "@/lib/analytics/text";
import type { McpHost, RunOutcome } from "@/lib/analytics/types";
import { mcpToolByName } from "@/registry/mcp-registry";

export type McpClientInfo = {
  name: string | null;
  version: string | null;
  protocol: string | null;
};

export type McpAnalyticsContext = RequestContext & {
  mcpSessionId: string | null;
  mcpClientName: string | null;
  mcpClientVersion: string | null;
  mcpProtocol: string | null;
  mcpHost: McpHost;
};

const clients = new Map<string, { info: McpClientInfo; at: number }>();
const als = new AsyncLocalStorage<McpAnalyticsContext>();
const SMALL_BODY = 16_384;

function cacheKey(ip: string, ua: string) {
  return createHash("sha256").update(`${ip}\n${ua}`).digest("hex");
}

function remember(ip: string, ua: string, info: McpClientInfo) {
  if (clients.size > 5000) {
    const oldest = clients.keys().next().value;
    if (oldest) clients.delete(oldest);
  }
  clients.set(cacheKey(ip, ua), { info, at: Date.now() });
}

function recall(ip: string, ua: string): McpClientInfo | null {
  const hit = clients.get(cacheKey(ip, ua));
  if (!hit) return null;
  if (Date.now() - hit.at > 6 * 60 * 60 * 1000) {
    clients.delete(cacheKey(ip, ua));
    return null;
  }
  return hit.info;
}

function messagesOf(text: string): unknown[] {
  try {
    const data: unknown = JSON.parse(text);
    return Array.isArray(data) ? data : [data];
  } catch {
    return [];
  }
}

export function readInitialize(text: string): McpClientInfo | null {
  for (const message of messagesOf(text)) {
    if (!message || typeof message !== "object") continue;
    if ((message as { method?: unknown }).method !== "initialize") continue;
    const params = (message as { params?: unknown }).params;
    if (!params || typeof params !== "object") continue;
    const info = (params as { clientInfo?: unknown }).clientInfo;
    const name = info && typeof info === "object" ? (info as { name?: unknown }).name : null;
    const version = info && typeof info === "object" ? (info as { version?: unknown }).version : null;
    const protocol = (params as { protocolVersion?: unknown }).protocolVersion;
    return {
      name: typeof name === "string" ? cleanLabel(name) : null,
      version: typeof version === "string" ? cleanLabel(version, 32) : null,
      protocol: typeof protocol === "string" ? cleanProtocol(protocol) : null,
    };
  }
  return null;
}

export function readToolName(text: string): string | null {
  for (const message of messagesOf(text)) {
    if (!message || typeof message !== "object") continue;
    if ((message as { method?: unknown }).method !== "tools/call") continue;
    const params = (message as { params?: unknown }).params;
    if (!params || typeof params !== "object") continue;
    const name = (params as { name?: unknown }).name;
    if (typeof name !== "string") return null;
    return /^[a-z0-9_]{1,64}$/.test(name) ? name : null;
  }
  return null;
}

export function mcpHostName(hostHeader: string | null): McpHost {
  return hostnameFromHost(hostHeader) === LEGACY_HOST ? "legacy" : "benchline";
}

export async function loadMcpAnalytics(request: Request): Promise<McpAnalyticsContext & { toolName: string | null }> {
  const base = requestContext(request);
  const ip = analyticsIp(request) ?? "";
  const ua = request.headers.get("user-agent") ?? "";
  let client = recall(ip, ua);
  let toolName: string | null = null;
  const length = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(length) && length > 0 && length <= SMALL_BODY) {
    try {
      const text = await request.clone().text();
      const init = readInitialize(text);
      if (init) {
        remember(ip, ua, init);
        client = init;
      }
      toolName = readToolName(text);
    } catch {
      toolName = null;
    }
  }
  const protocol = client?.protocol ?? cleanProtocol(request.headers.get("mcp-protocol-version"));
  return {
    ...base,
    mcpSessionId: sessionKey(request.headers.get("mcp-session-id")),
    mcpClientName: client?.name ?? null,
    mcpClientVersion: client?.version ?? null,
    mcpProtocol: protocol,
    mcpHost: mcpHostName(request.headers.get("host")),
    toolName,
  };
}

export function runWithMcpContext<T>(ctx: McpAnalyticsContext, fn: () => Promise<T>): Promise<T> {
  return als.run(ctx, fn);
}

export function recordMcpTool(input: {
  slug: string;
  outcome: RunOutcome;
  errorCode: string | null;
  durationMs: number | null;
  inputBytes: number | null;
  outputBytes: number | null;
}) {
  const ctx = als.getStore();
  recordRun(
    {
      ipHash: ctx?.ipHash ?? null,
      country: ctx?.country ?? null,
      uaFamily: ctx?.uaFamily ?? null,
      referrerHost: ctx?.referrerHost ?? null,
      visitorId: ctx?.visitorId ?? null,
      sessionId: ctx?.sessionId ?? null,
    },
    {
      ...input,
      source: "mcp",
      mcpSessionId: ctx?.mcpSessionId ?? null,
      mcpClientName: ctx?.mcpClientName ?? null,
      mcpClientVersion: ctx?.mcpClientVersion ?? null,
      mcpProtocol: ctx?.mcpProtocol ?? null,
      mcpHost: ctx?.mcpHost ?? null,
    },
  );
}

export function knownMcpTool(name: string | null): boolean {
  if (!name) return false;
  return Boolean(mcpToolByName(name));
}

export function resetMcpClientsForTests() {
  clients.clear();
}
