import { cleanErrorCode } from "@/lib/analytics/text";
import { enqueue } from "@/lib/analytics/store";
import { isHealthPath } from "@/lib/net/legacy-host";
import type { ActionEvent, PageViewEvent, RunOutcome, RunSource, SearchEvent, ToolOpenEvent, ToolRunEvent } from "@/lib/analytics/types";
import type { RequestContext } from "@/lib/analytics/context";

function nowIso() {
  return new Date().toISOString();
}

export function recordRun(
  ctx: RequestContext,
  input: {
    slug: string;
    source: RunSource;
    outcome: RunOutcome;
    errorCode: string | null;
    durationMs: number | null;
    inputBytes: number | null;
    outputBytes: number | null;
    mcpSessionId?: string | null;
    mcpClientName?: string | null;
    mcpClientVersion?: string | null;
    mcpProtocol?: string | null;
    mcpHost?: ToolRunEvent["mcpHost"];
  },
) {
  const event: ToolRunEvent = {
    kind: "run",
    ts: nowIso(),
    slug: input.slug,
    source: input.source,
    outcome: input.outcome,
    errorCode: cleanErrorCode(input.errorCode),
    durationMs: input.durationMs,
    inputBytes: input.inputBytes,
    outputBytes: input.outputBytes,
    ipHash: ctx.ipHash,
    country: ctx.country,
    uaFamily: ctx.uaFamily,
    referrerHost: ctx.referrerHost,
    visitorId: ctx.visitorId,
    sessionId: ctx.sessionId,
    mcpSessionId: input.mcpSessionId ?? null,
    mcpClientName: input.mcpClientName ?? null,
    mcpClientVersion: input.mcpClientVersion ?? null,
    mcpProtocol: input.mcpProtocol ?? null,
    mcpHost: input.mcpHost ?? null,
  };
  enqueue(event);
}

export function recordPage(event: Omit<PageViewEvent, "kind" | "ts">) {
  if (isHealthPath(event.path)) return;
  enqueue({ kind: "page", ts: nowIso(), ...event });
}

export function recordToolOpen(event: Omit<ToolOpenEvent, "kind" | "ts">) {
  enqueue({ kind: "tool_open", ts: nowIso(), ...event });
}

export function recordSearch(event: Omit<SearchEvent, "kind" | "ts">) {
  enqueue({ kind: "search", ts: nowIso(), ...event });
}

export function recordAction(event: Omit<ActionEvent, "kind" | "ts">) {
  enqueue({ kind: "action", ts: nowIso(), ...event });
}
