import type { Migration } from "@/lib/analytics/sql";

export type MigrationTx = {
  applied(): Promise<string[]>;
  apply(migration: Migration): Promise<void>;
};

export type MigrationDriver = {
  bootstrap(): Promise<void>;
  locked(run: (tx: MigrationTx) => Promise<void>): Promise<void>;
};

export async function applyMigrations(driver: MigrationDriver, migrations: readonly Migration[]) {
  await driver.bootstrap();
  await driver.locked(async (tx) => {
    const done = new Set(await tx.applied());
    for (const migration of migrations) {
      if (done.has(migration.version)) continue;
      await tx.apply(migration);
      done.add(migration.version);
    }
  });
}
