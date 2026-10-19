import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminEnv } from "@/lib/admin/config";
import { readSession, type AdminSession } from "@/lib/admin/session";

export async function currentAdminSession(): Promise<AdminSession | null> {
  const env = adminEnv();
  if (!env) return null;
  const jar = await cookies();
  return readSession(jar.get(ADMIN_COOKIE)?.value, env.secret);
}
