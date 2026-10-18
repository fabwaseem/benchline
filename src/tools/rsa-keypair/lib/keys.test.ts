import { describe, expect, it } from "vitest";
import { generateMaterial, jwkToMaterial, pemToMaterial } from "@/tools/rsa-keypair/lib/keys";

describe("generateMaterial", () => {
  it("returns PEM and JWK for Ed25519 and round-trips the private key", async () => {
    const created = await generateMaterial("Ed25519");
    expect(created.publicPem).toContain("BEGIN PUBLIC KEY");
    expect(created.privatePem).toContain("BEGIN PRIVATE KEY");
    expect(created.jwks).toContain('"keys"');
    const fromPem = await pemToMaterial(created.privatePem, "Ed25519");
    expect(fromPem).toMatchObject({ alg: "Ed25519" });
    if ("error" in fromPem) return;
    expect(JSON.parse(fromPem.publicJwk).kty).toBe("OKP");
    const fromJwk = await jwkToMaterial(created.privateJwk, "Ed25519");
    expect(fromJwk).toMatchObject({ alg: "Ed25519" });
    if ("error" in fromJwk) return;
    expect(fromJwk.publicPem).toContain("BEGIN PUBLIC KEY");
  });

  it("keeps a public PEM conversion free of a private key", async () => {
    const created = await generateMaterial("ES256");
    const converted = await pemToMaterial(created.publicPem, "ES256");
    if ("error" in converted) throw new Error(converted.error);
    expect(converted.privatePem).toBe("");
    expect(converted.privateJwk).toBe("");
    expect(JSON.parse(converted.publicJwk).d).toBeUndefined();
  });
});
