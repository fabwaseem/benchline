import { createPostgresStore, openDatabase } from "../src/lib/analytics/db";
import { retentionDays } from "../src/lib/analytics/duration";
import { loadLocalEnv } from "./load-env";

loadLocalEnv();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is unset");
    process.exit(1);
  }
  const sql = openDatabase(url);
  try {
    const store = createPostgresStore(sql);
    await store.migrate();
    await store.retain(retentionDays());
    console.info(`analytics retention applied (${retentionDays()} days)`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "retention failed";
  console.error(message.replace(/postgres(?:ql)?:\/\/\S+/gi, "postgres://redacted"));
  process.exit(1);
});
