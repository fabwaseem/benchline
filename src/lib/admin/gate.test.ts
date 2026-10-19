import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import { ADMIN_COOKIE, ADMIN_MAX_AGE_SEC } from "@/lib/admin/config";
import { issueSession } from "@/lib/admin/session";
import { proxy } from "@/proxy";

const password = "correct horse battery";
const secret = "session-secret-value";

function configure() {
  process.env.ADMIN_PASSWORD = password;
  process.env.ADMIN_SESSION_SECRET = secret;
}

function request(pathname: string, init?: { method?: string; cookie?: string; host?: string }) {
  const host = init?.host ?? "benchline.fabwaseem.com";
  const headers = new Headers({ host });
  if (init?.cookie) headers.set("cookie", init.cookie);
  return proxy(new NextRequest(`https://${host}${pathname}`, { method: init?.method ?? "GET", headers }));
}

function expectLogin(response: Response, status: number) {
  expect(response.status).toBe(status);
  expect(response.headers.get("location")).toBe("https://benchline.fabwaseem.com/admin/login");
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(response.headers.get("x-robots-tag")).toContain("noindex");
  expect(response.headers.get("x-middleware-rewrite")).toBeNull();
}

describe("admin proxy gate", () => {
  afterEach(() => {
    delete process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_SESSION_SECRET;
  });

  it("redirects when the session cookie is missing", async () => {
    configure();
    expectLogin(await request("/admin"), 307);
    expectLogin(await request("/admin/tools?range=30d"), 307);
    expectLogin(await request("/admin/live", { method: "HEAD" }), 307);
    expectLogin(await request("/admin/tools", { method: "POST" }), 303);

    const login = await request("/admin/login");
    expect(login.status).toBe(200);
    expect(login.headers.get("location")).toBeNull();
    expect(login.headers.get("cache-control")).toContain("no-store");
    expect(login.headers.get("x-robots-tag")).toContain("noindex");

    const posted = await request("/admin/login", { method: "POST" });
    expect(posted.status).toBe(200);
    expect(posted.headers.get("location")).toBeNull();

    const action = await request("/api/admin/login", { method: "POST" });
    expect(action.status).toBe(200);
    expect(action.headers.get("location")).toBeNull();
  });

  it("redirects a bad signature", async () => {
    configure();
    const issued = await issueSession(secret);
    const dot = issued.token.indexOf(".");
    const mac = issued.token.slice(dot + 1);
    const flipped = `${mac.slice(0, -1)}${mac.endsWith("a") ? "b" : "a"}`;
    const bad = await request("/admin", { cookie: `${ADMIN_COOKIE}=${issued.token.slice(0, dot + 1)}${flipped}` });
    expectLogin(bad, 307);
    const other = await request("/admin/errors", { cookie: `${ADMIN_COOKIE}=${(await issueSession("other-secret")).token}` });
    expectLogin(other, 307);
  });

  it("redirects an expired session", async () => {
    configure();
    const issued = await issueSession(secret, Date.now() - ADMIN_MAX_AGE_SEC * 1000 - 60_000);
    const response = await request("/admin/mcp", { cookie: `${ADMIN_COOKIE}=${issued.token}` });
    expectLogin(response, 307);
  });

  it("passes a valid cookie", async () => {
    configure();
    const issued = await issueSession(secret);
    const cookie = `${ADMIN_COOKIE}=${issued.token}`;
    for (const pathname of ["/admin", "/admin/tools", "/admin/tools/json-formatter"]) {
      const response = await request(pathname, { cookie });
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
      expect(response.headers.get("x-middleware-rewrite")).toBeNull();
      expect(response.headers.get("cache-control")).toContain("no-store");
      expect(response.headers.get("x-robots-tag")).toContain("noindex");
    }
    const posted = await request("/admin/live", { method: "POST", cookie });
    expect(posted.status).toBe(200);
    expect(posted.headers.get("location")).toBeNull();
  });

  it("returns 404 when admin env is missing", async () => {
    for (const pathname of ["/admin", "/admin/login", "/admin/tools"]) {
      const response = await request(pathname);
      expect(response.status).toBe(404);
      expect(response.headers.get("location")).toBeNull();
      expect(response.headers.get("cache-control")).toContain("no-store");
      expect(response.headers.get("x-robots-tag")).toContain("noindex");
    }
    process.env.ADMIN_PASSWORD = password;
    expect((await request("/admin/live")).status).toBe(404);
    delete process.env.ADMIN_PASSWORD;
    process.env.ADMIN_SESSION_SECRET = secret;
    expect((await request("/admin/login", { method: "POST" })).status).toBe(404);
  });

  it("keeps the legacy host redirect and the mcp passthrough", async () => {
    configure();
    const legacy = await request("/admin/tools?x=1", { host: "tools.fabwaseem.com" });
    expect(legacy.status).toBe(308);
    expect(legacy.headers.get("location")).toBe("https://benchline.fabwaseem.com/admin/tools?x=1");

    const mcp = await request("/mcp", { method: "POST", host: "tools.fabwaseem.com" });
    expect(mcp.status).toBe(200);
    expect(mcp.headers.get("location")).toBeNull();
    expect(mcp.headers.get("x-middleware-rewrite")).toBeNull();

    const guide = await proxy(
      new NextRequest("https://benchline.fabwaseem.com/mcp", {
        method: "GET",
        headers: { host: "benchline.fabwaseem.com", accept: "text/html" },
      }),
    );
    expect(guide.status).toBe(200);
    expect(guide.headers.get("x-middleware-rewrite") ?? guide.headers.get("location")).toContain("/mcp/guide");
  });
});
