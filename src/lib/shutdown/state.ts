const DRAINING = Symbol.for("benchline.draining");
const CLEANUP = Symbol.for("benchline.shutdown.cleanup");

type ShutdownGlobal = typeof globalThis & {
  [DRAINING]?: boolean;
  [CLEANUP]?: Array<() => Promise<void>>;
};

function globals(): ShutdownGlobal {
  return globalThis as ShutdownGlobal;
}

export function isDraining(): boolean {
  return globals()[DRAINING] === true;
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
