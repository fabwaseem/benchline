const DRAINING = Symbol.for("benchline.draining");
const CLEANUP = Symbol.for("benchline.shutdown.cleanup");
const INFLIGHT = Symbol.for("benchline.http.inflight");

type ShutdownGlobal = typeof globalThis & {
  [DRAINING]?: boolean;
  [CLEANUP]?: Array<() => Promise<void>>;
  [INFLIGHT]?: number;
};

function globals(): ShutdownGlobal {
  return globalThis as ShutdownGlobal;
}

export function isDraining(): boolean {
  return globals()[DRAINING] === true;
}

export function inflightRequests(): number {
  const value = globals()[INFLIGHT];
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}

export function markDraining(): void {
  globals()[DRAINING] = true;
}

export function clearDrainingForTests(): void {
  globals()[DRAINING] = false;
}

export function registerShutdownCleanup(fn: () => Promise<void>): () => void {
  const slot = globals();
  const list = slot[CLEANUP] ?? [];
  list.push(fn);
  slot[CLEANUP] = list;
  return () => {
    const current = globals()[CLEANUP];
    if (!current) return;
    const index = current.indexOf(fn);
    if (index !== -1) current.splice(index, 1);
  };
}

export async function runShutdownCleanup(): Promise<void> {
  const list = globals()[CLEANUP];
  if (!list) return;
  for (const fn of [...list]) await fn();
}
