import { inflightRequests, markDraining, runShutdownCleanup } from "@/lib/shutdown/state";

export const DEFAULT_DRAIN_MS = 9_000;
export const FORCE_EXIT_MS = 25_000;
export const INFLIGHT_CLOSE_MS = 5_000;
export const KEEP_ALIVE_TIMEOUT_MS = 65_000;
export const HEADERS_TIMEOUT_MS = 66_000;
const MAX_DRAIN_MS = FORCE_EXIT_MS - 1_000;

export function parseDrainMs(raw: string | undefined): number {
  if (raw == null || raw.trim() === "") return DEFAULT_DRAIN_MS;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return DEFAULT_DRAIN_MS;
  return Math.min(Math.floor(value), MAX_DRAIN_MS);
}

export type ClosableServer = {
  close: (callback: (error?: Error) => void) => void;
  closeIdleConnections?: () => void;
  closeAllConnections?: () => void;
  keepAliveTimeout?: number;
  headersTimeout?: number;
};

export function applyServerTimeouts(server: Pick<ClosableServer, "keepAliveTimeout" | "headersTimeout">): void {
  server.headersTimeout = HEADERS_TIMEOUT_MS;
  server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;
}

export type ShutdownDeps = {
  drainMs: number;
  forceMs?: number;
  servers: () => Iterable<ClosableServer>;
  inflight?: () => number;
  cleanup?: () => Promise<void>;
  exit: (code: number) => void;
  setTimeout: typeof globalThis.setTimeout;
  clearTimeout: typeof globalThis.clearTimeout;
  log?: (message: string) => void;
};

export function createShutdown(deps: ShutdownDeps): (signal: "SIGTERM" | "SIGINT") => void {
  let started = false;
  const forceMs = deps.forceMs ?? FORCE_EXIT_MS;
  const cleanup = deps.cleanup ?? runShutdownCleanup;
  const inflight = deps.inflight ?? inflightRequests;
  const log = deps.log ?? ((message: string) => console.info(message));

  return function shutdown(signal) {
    if (started) return;
    started = true;
    markDraining();
    log(`[shutdown] ${signal}: draining for ${deps.drainMs}ms`);
    const force = deps.setTimeout(() => {
      console.error(`[shutdown] force exit after ${forceMs}ms`);
      log("exiting 0");
      deps.exit(0);
    }, forceMs);
    deps.setTimeout(() => {
      void finish();
    }, deps.drainMs);

    async function finish() {
      try {
        log("closing server");
        const open = inflight();
        await closeServers(deps.servers(), deps.setTimeout, deps.clearTimeout);
        log(`closed, in-flight=${open}`);
        await cleanup();
      } catch (error) {
        console.error("[shutdown] cleanup failed", error);
      }
      deps.clearTimeout(force);
      log("exiting 0");
      deps.exit(0);
    }
  };
}

function closeServers(
  servers: Iterable<ClosableServer>,
  schedule: typeof globalThis.setTimeout,
  cancel: typeof globalThis.clearTimeout,
): Promise<void> {
  const pending = [...servers].map(
    (server) =>
      new Promise<void>((resolve) => {
        let settled = false;
        server.closeIdleConnections?.();
        const kill = schedule(() => {
          if (!settled) server.closeAllConnections?.();
        }, INFLIGHT_CLOSE_MS);
        server.close(() => {
          settled = true;
          cancel(kill);
          resolve();
        });
      }),
  );
  return Promise.all(pending).then(() => undefined);
}

export function exitWithCode(code: number): void {
  process.exitCode = code;
  let remaining = 2;
  const finish = () => {
    remaining -= 1;
    if (remaining === 0) process.exit();
  };
  const flush = (stream: NodeJS.WriteStream) => {
    try {
      stream.write("", finish);
    } catch {
      finish();
    }
  };
  flush(process.stdout);
  flush(process.stderr);
}
