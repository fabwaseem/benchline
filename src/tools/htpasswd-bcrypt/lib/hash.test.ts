import { describe, expect, it } from "vitest";
import { algorithmOf, hashPassword, htpasswdLine } from "@/tools/htpasswd-bcrypt/lib/hash";

describe("hashPassword", () => {
  it("hashes bcrypt and verifies it without echoing the password", async () => {
    const hashed = await hashPassword({ password: "correct horse", algorithm: "bcrypt", cost: 4, username: "ada" });
    expect(hashed).toMatchObject({ algorithm: "bcrypt", verified: null });
    if ("error" in hashed) return;
    expect(hashed.hash.startsWith("$2a$04$")).toBe(true);
    expect(hashed.htpasswd).toBe(htpasswdLine("ada", hashed.hash));
    expect(JSON.stringify(hashed)).not.toContain("correct horse");
    const ok = await hashPassword({ password: "correct horse", algorithm: "bcrypt", hash: hashed.hash });
    const bad = await hashPassword({ password: "nope", algorithm: "bcrypt", hash: hashed.hash });
    expect(ok).toMatchObject({ verified: true });
    expect(bad).toMatchObject({ verified: false });
    expect(algorithmOf(hashed.hash)).toBe("bcrypt");
  });

  it("hashes argon2id", async () => {
    const hashed = await hashPassword({
      password: "battery",
      algorithm: "argon2id",
      iterations: 1,
      memory: 8,
      parallelism: 1,
    });
    expect(hashed).toMatchObject({ algorithm: "argon2id" });
    if ("error" in hashed) return;
    expect(hashed.hash.startsWith("$argon2id$")).toBe(true);
    const ok = await hashPassword({ password: "battery", algorithm: "argon2id", hash: hashed.hash });
    expect(ok).toMatchObject({ verified: true });
  });

  it("rejects an empty password and a colon in the username", async () => {
    expect(await hashPassword({ password: "", algorithm: "bcrypt" })).toMatchObject({ error: expect.stringMatching(/password/i) });
    expect(await hashPassword({ password: "x", algorithm: "bcrypt", cost: 4, username: "a:b" })).toMatchObject({ error: expect.stringMatching(/Username/) });
  });
});
