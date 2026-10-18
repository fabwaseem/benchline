import path from "node:path";
import { downloadGeoDatabase } from "../src/lib/analytics/geodb";

async function main() {
  const dest = process.env.GEOIP_DB_PATH?.trim() || path.join(process.cwd(), "data", "dbip-country-lite.mmdb");
  const ok = await downloadGeoDatabase(dest);
  if (ok) console.info(`[analytics] wrote ${dest}`);
  else console.warn("[analytics] country database was not downloaded; country stays null until a file is present");
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "download failed";
    console.warn(`[analytics] country database download failed: ${message}`);
    process.exit(0);
  });
