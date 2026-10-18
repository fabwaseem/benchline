import { access, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { Reader, type CountryResponse } from "mmdb-lib";
import { countryFromRecord } from "@/lib/analytics/country";
import { safeError } from "@/lib/analytics/clean";
import { analyticsRuntime } from "@/lib/analytics/global";

const MAX_GZIP_BYTES = 30_000_000;
const MAX_DB_BYTES = 80_000_000;
const FILE_NAME = "dbip-country-lite.mmdb";

export function geodbUrls(now = new Date()): string[] {
  return [0, 1, 2].map((offset) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    return `https://download.db-ip.com/free/dbip-country-lite-${month}.mmdb.gz`;
  });
}

export function lookupCountry(ip: string): string | null {
  const reader = analyticsRuntime().reader;
  if (!reader || !ip) {
    if (ip) void ensureGeoDb();
    return null;
  }
  try {
    return countryFromRecord(reader.get(ip));
  } catch {
    return null;
  }
}

export function geoDbPaths(): string[] {
  const configured = process.env.GEOIP_DB_PATH?.trim();
  return [
    configured || "",
    path.join(process.cwd(), "data", FILE_NAME),
    path.join(os.tmpdir(), `benchline-${FILE_NAME}`),
  ].filter((item) => item.length > 0);
}

async function fileExists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

function openReader(bytes: Buffer): Reader<CountryResponse> | null {
  if (bytes.length < 128) return null;
  try {
    return new Reader<CountryResponse>(bytes);
  } catch (error) {
    console.warn("[analytics] country database could not be opened", safeError(error));
    return null;
  }
}

export function shouldDownloadGeoDb(): boolean {
  if (process.env.GEOIP_DOWNLOAD === "0") return false;
  if (process.env.NODE_ENV === "test") return false;
  return true;
}

export async function downloadGeoDatabase(dest: string, now = new Date()): Promise<boolean> {
  for (const url of geodbUrls(now)) {
    try {
      const response = await fetch(url, { redirect: "follow" });
      if (!response.ok || !response.body) continue;
      const length = Number(response.headers.get("content-length") ?? "0");
      if (length > MAX_GZIP_BYTES) continue;
      const gzipped = Buffer.from(await response.arrayBuffer());
      if (gzipped.length === 0 || gzipped.length > MAX_GZIP_BYTES) continue;
      const body = gunzipSync(gzipped, { maxOutputLength: MAX_DB_BYTES });
      if (body.length < 128) continue;
      await mkdir(path.dirname(dest), { recursive: true });
      const tmp = `${dest}.tmp`;
      await writeFile(tmp, body);
      await rename(tmp, dest);
      return true;
    } catch (error) {
      console.warn("[analytics] country database download failed", safeError(error));
    }
  }
  return false;
}

export async function ensureGeoDb(): Promise<void> {
  const slot = analyticsRuntime();
  if (slot.reader) return;
  if (slot.geoLoading) return slot.geoLoading;
  slot.geoLoading = (async () => {
    for (const file of geoDbPaths()) {
      if (!(await fileExists(file))) continue;
      const bytes = await readFile(file);
      const opened = openReader(bytes);
      if (opened) {
        analyticsRuntime().reader = opened;
        return;
      }
    }
    if (!shouldDownloadGeoDb()) return;
    const dest = path.join(os.tmpdir(), `benchline-${FILE_NAME}`);
    const ok = await downloadGeoDatabase(dest);
    if (!ok) return;
    const opened = openReader(await readFile(dest));
    if (opened) analyticsRuntime().reader = opened;
  })().catch((error: unknown) => {
    console.warn("[analytics] country database unavailable", safeError(error));
    analyticsRuntime().geoLoading = null;
  });
  await slot.geoLoading;
}

/** Test hook. Production code does not replace the reader. */
export function setGeoReaderForTests(next: Reader<CountryResponse> | null) {
  const slot = analyticsRuntime();
  slot.reader = next;
  slot.geoLoading = next ? Promise.resolve() : null;
}

export function geoReaderOpen(): boolean {
  return analyticsRuntime().reader !== null;
}
