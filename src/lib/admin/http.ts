import { adminEnv } from "@/lib/admin/config";
import { csrfMatches } from "@/lib/admin/csrf";
import { checkLoginLimit } from "@/lib/admin/limit";
import { passwordsMatch } from "@/lib/admin/password";
import { clearSessionCookie, issueSession, sessionCookie, sessionFromRequest, type AdminSession } from "@/lib/admin/session";
import { hashIp } from "@/lib/analytics/hash";
import { analyticsIp } from "@/lib/analytics/ip";

export function privateJson(body: unknown, status: number, extra?: Record<string, string>): Response {
  return Response.json(body, {
    status,
    headers: { "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow", ...extra },
  });
}

export function notConfigured(): Response {
  return new Response(null, { status: 404, headers: { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } });
}

export async function requireSession(request: Request): Promise<{ secret: string; session: AdminSession } | Response> {
  const env = adminEnv();
  if (!env) return notConfigured();
  const session = await sessionFromRequest(request, env.secret);
  if (!session) return privateJson({ error: "Sign in required." }, 401);
  return { secret: env.secret, session };
}

export async function loginAttempt(request: Request, password: string): Promise<Response> {
  const env = adminEnv();
  if (!env) return notConfigured();
  const ip = analyticsIp(request) ?? "unknown";
  const key = hashIp(ip, env.secret) ?? "unknown";
  const limit = checkLoginLimit(key);
  if (!limit.ok) return privateJson({ error: "Too many attempts." }, 429, { "retry-after": String(limit.retryAfter) });
  if (!passwordsMatch(password, env.password)) return privateJson({ error: "Wrong password." }, 401);
  const issued = await issueSession(env.secret);
  return privateJson({ ok: true }, 200, { "set-cookie": sessionCookie(issued.token) });
}

export async function logoutAttempt(request: Request, csrf: string | null): Promise<Response> {
  const gate = await requireSession(request);
  if (gate instanceof Response) return gate;
  if (!csrfMatches(csrf, gate.session.csrf)) return privateJson({ error: "Invalid session." }, 403);
  return privateJson({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
}
