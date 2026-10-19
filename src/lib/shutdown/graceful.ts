import { markDraining, runShutdownCleanup } from "@/lib/shutdown/state";

export const DEFAULT_DRAIN_MS = 9_000;
export const FORCE_EXIT_MS = 25_000;
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
};

export type ShutdownDeps = {
  drainMs: number;
  forceMs?: number;
  servers: () => Iterable<ClosableServer>;
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
  const log = deps.log ?? ((message: string) => console.info(message));

  return function shutdown(signal) {
    if (started) return;
    started = true;
    markDraining();
    log(`[shutdown] ${signal}: draining for ${deps.drainMs}ms`);
    const force = deps.setTimeout(() => {
      console.error(`[shutdown] force exit after ${forceMs}ms`);
      deps.exit(0);
    }, forceMs);
    deps.setTimeout(() => {
      void finish();
    }, deps.drainMs);

    async function finish() {
      try {
        await closeServers(deps.servers());
        await cleanup();
      } catch (error) {
        console.error("[shutdown] cleanup failed", error);
      }
      deps.clearTimeout(force);
      deps.exit(0);
    }
  };
}

function closeServers(servers: Iterable<ClosableServer>): Promise<void> {
  const pending = [...servers].map(
    (server) =>
      new Promise<void>((resolve) => {
        const idle = setInterval(() => {
          server.closeIdleConnections?.();
        }, 200);
        server.close(() => {
          clearInterval(idle);
          resolve();
        });
        server.closeIdleConnections?.();
      }),
  );
  return Promise.all(pending).then(() => undefined);
}
