import { exportSPKI, generateKeyPair, SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { signHs, verifyJwt } from "@/tools/jwt-decoder/lib/verify";

describe("verifyJwt", () => {
  it("verifies HS256 and rejects a wrong secret", async () => {
    const token = await signHs(
      JSON.stringify({ typ: "JWT" }),
      JSON.stringify({ sub: "ada" }),
      "toolsmith-example",
      "HS256",
    );
    const ok = await verifyJwt(token, "HS256", "toolsmith-example", "utf8");
    const bad = await verifyJwt(token, "HS256", "other-secret", "utf8");
    expect(ok.status).toBe("verified");
    expect(bad.status).toBe("invalid");
  });

  it("verifies RS256 and ES256 public keys", async () => {
    for (const alg of ["RS256", "ES256"] as const) {
      const { publicKey, privateKey } = await generateKeyPair(alg);
      const token = await new SignJWT({ sub: "ada" }).setProtectedHeader({ alg }).sign(privateKey);
      const pem = await exportSPKI(publicKey);
      const result = await verifyJwt(token, alg, pem, "utf8");
      expect(result.status).toBe("verified");
    }
  });

  it("reports alg none as unsupported", async () => {
    const result = await verifyJwt("a.b.c", "none", "secret", "utf8");
    expect(result.status).toBe("unsupported");
  });
});
