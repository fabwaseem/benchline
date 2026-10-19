import { applyServerTimeouts, createShutdown, exitWithCode, parseDrainMs, type ClosableServer } from "@/lib/shutdown/graceful";

const SERVERS = Symbol.for("benchline.http.servers");
const HANDLE = Symbol.for("benchline.shutdown.handle");
const LISTENING = Symbol.for("benchline.shutdown.listening");

type Signal = "SIGTERM" | "SIGINT";

type ShutdownGlobal = typeof globalThis & {
  [SERVERS]?: Set<unknown>;
  [HANDLE]?: (signal: Signal) => void;
  [LISTENING]?: boolean;
};

function globals(): ShutdownGlobal {
  return globalThis as ShutdownGlobal;
}

function trackedServers(): ClosableServer[] {
  const value = globals()[SERVERS];
  if (!(value instanceof Set)) return [];
  const servers: ClosableServer[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || !("close" in item)) continue;
    const close = (item as { close?: unknown }).close;
    if (typeof close !== "function") continue;
    servers.push(item as ClosableServer);
  }
  return servers;
}

export function installGracefulShutdown(): void {
  for (const server of trackedServers()) applyServerTimeouts(server);
  const slot = globals();
  if (slot[HANDLE]) return;
  const shutdown = createShutdown({
    drainMs: parseDrainMs(process.env.SHUTDOWN_DRAIN_MS),
    servers: trackedServers,
    exit: exitWithCode,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
  });
  slot[HANDLE] = shutdown;
  if (slot[LISTENING]) return;
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  slot[LISTENING] = true;
}
