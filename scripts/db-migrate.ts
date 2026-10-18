import { createPostgresStore, openDatabase } from "../src/lib/analytics/db";
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
    await createPostgresStore(sql).migrate();
    console.info("analytics migrations applied");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "migration failed";
  console.error(message.replace(/postgres(?:ql)?:\/\/\S+/gi, "postgres://redacted"));
  process.exit(1);
});
