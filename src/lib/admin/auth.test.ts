import { afterEach, describe, expect, it } from "vitest";
import { ADMIN_COOKIE, ADMIN_MAX_AGE_SEC, queryTimeoutMs, timeoutConfig } from "@/lib/admin/config";
import { csrfMatches } from "@/lib/admin/csrf";
import { LOGIN_LIMIT, resetLoginLimit } from "@/lib/admin/limit";
import { passwordsMatch } from "@/lib/admin/password";
import { clearSessionCookie, issueSession, readSession, sessionCookie, sessionFromRequest } from "@/lib/admin/session";
import { POST as login } from "@/app/api/admin/login/route";
import { POST as logout } from "@/app/api/admin/logout/route";
import { GET as csv } from "@/app/api/admin/export/route";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { MIGRATIONS } from "@/lib/analytics/sql";

const password = "correct horse battery";
const secret = "session-secret-value";

function env() {
  process.env.ADMIN_PASSWORD = password;
  process.env.ADMIN_SESSION_SECRET = secret;
}

describe("admin auth", () => {
  afterEach(() => {
    delete process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_SESSION_SECRET;
    delete process.env.ADMIN_QUERY_TIMEOUT_MS;
    resetLoginLimit();
  });

  it("signs a cookie, rejects a bad mac, and expires it", () => {
    const issued = issueSession(secret, 1_700_000_000_000);
    const session = readSession(issued.token, secret, 1_700_000_000_000);
    expect(session?.csrf).toBe(issued.session.csrf);
    expect(session?.exp).toBe(issued.session.exp);
    expect(readSession(issued.token, "other-secret", 1_700_000_000_000)).toBeNull();
    expect(readSession(`${issued.token}x`, secret, 1_700_000_000_000)).toBeNull();
    expect(readSession(issued.token, secret, issued.session.exp)).toBeNull();
    expect(readSession(issued.token, secret, issued.session.exp + 1000)).toBeNull();
    const header = sessionCookie(issued.token);
    expect(header).toContain(`${ADMIN_COOKIE}=`);
    expect(header).toContain("HttpOnly");
    expect(header).toContain("Secure");
    expect(header).toContain("SameSite=Strict");
    expect(header).toContain(`Max-Age=${ADMIN_MAX_AGE_SEC}`);
    expect(clearSessionCookie()).toContain("Max-Age=0");
  });

  it("compares passwords without caring about length", () => {
    expect(passwordsMatch(password, password)).toBe(true);
    expect(passwordsMatch("nope", password)).toBe(false);
    expect(passwordsMatch("x", password)).toBe(false);
    expect(passwordsMatch("", password)).toBe(false);
  });

  it("checks the csrf token in constant time", () => {
    expect(csrfMatches("abc", "abc")).toBe(true);
    expect(csrfMatches("abc", "abd")).toBe(false);
    expect(csrfMatches(null, "abc")).toBe(false);
  });

  it("returns 404 when admin env is missing", async () => {
    const response = await login(new Request("https://benchline.fabwaseem.com/api/admin/login", { method: "POST", body: JSON.stringify({ password }), headers: { "content-type": "application/json" } }));
    expect(response.status).toBe(404);
    const open = await csv(new Request("https://benchline.fabwaseem.com/api/admin/export?table=tools"));
    expect(open.status).toBe(404);
  });

  it("rejects a wrong password and rate limits the address", async () => {
    env();
    const headers = { "content-type": "application/json", "x-real-ip": "203.0.113.50" };
    for (let attempt = 0; attempt < LOGIN_LIMIT; attempt += 1) {
      const response = await login(new Request("https://benchline.fabwaseem.com/api/admin/login", { method: "POST", headers, body: JSON.stringify({ password: "wrong-password" }) }));
      expect(response.status).toBe(401);
    }
    const limited = await login(new Request("https://benchline.fabwaseem.com/api/admin/login", { method: "POST", headers, body: JSON.stringify({ password }) }));
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBeTruthy();
  });

  it("sets the session cookie on success and rejects anonymous admin routes", async () => {
    env();
    const signed = await login(new Request("https://benchline.fabwaseem.com/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json", "x-real-ip": "203.0.113.51" },
      body: JSON.stringify({ password }),
    }));
    expect(signed.status).toBe(200);
    const cookie = signed.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Strict");
    const token = cookie.slice(cookie.indexOf("=") + 1, cookie.indexOf(";"));
    const session = readSession(token, secret);
    expect(session).not.toBeNull();

    const denied = await csv(new Request("https://benchline.fabwaseem.com/api/admin/export?table=tools"));
    expect(denied.status).toBe(401);
    const missingLogout = await logout(new Request("https://benchline.fabwaseem.com/api/admin/logout", { method: "POST" }));
    expect(missingLogout.status).toBe(401);

    const bad = await logout(new Request("https://benchline.fabwaseem.com/api/admin/logout", {
      method: "POST",
      headers: { cookie, "x-csrf-token": "not-the-token" },
    }));
    expect(bad.status).toBe(403);

    const request = new Request("https://benchline.fabwaseem.com/api/admin/logout", {
      method: "POST",
      headers: { cookie, "x-csrf-token": session?.csrf ?? "" },
    });
    expect(sessionFromRequest(request, secret)?.csrf).toBe(session?.csrf);
    const gone = await logout(request);
    expect(gone.status).toBe(200);
    expect(gone.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("clamps the admin query timeout", () => {
    expect(queryTimeoutMs(undefined)).toBe(8000);
    expect(queryTimeoutMs("50")).toBe(1000);
    expect(queryTimeoutMs("12000")).toBe(12000);
    expect(queryTimeoutMs("999999")).toBe(30_000);
    expect(timeoutConfig(8000)).toEqual({ text: "select set_config('statement_timeout', $1, true)", values: ["8000ms"] });
  });

  it("keeps admin out of the sitemap and robots", () => {
    expect(sitemap().some((page) => page.url.includes("/admin"))).toBe(false);
    const rules = robots().rules;
    const list = Array.isArray(rules) ? rules : [rules];
    expect(list.some((rule) => {
      const disallow = rule.disallow;
      return Array.isArray(disallow) ? disallow.includes("/admin") : disallow === "/admin";
    })).toBe(true);
    const migration = MIGRATIONS.find((item) => item.version === "002_admin_indexes");
    expect(migration?.statements.length).toBeGreaterThan(5);
    expect(migration?.statements.every((statement) => statement.startsWith("CREATE INDEX IF NOT EXISTS"))).toBe(true);
  });
});
