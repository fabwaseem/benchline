import { describe, expect, it } from "vitest";
import { decryptBundle, deriveKey, encryptText } from "@/tools/aes-crypto/lib/aes";

const ITERATIONS = 10_000;

describe("AES crypto", () => {
  it("round-trips text through encrypt and decrypt", async () => {
    const encrypted = await encryptText("hello world", "correct horse", ITERATIONS);
    if ("error" in encrypted) throw new Error(encrypted.error);
    expect(encrypted.bundle).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(encrypted.bundleJson).toMatchObject({ v: 1, iter: ITERATIONS });
    expect(encrypted.bundleJson.salt).not.toBe(encrypted.bundleJson.iv);
    const decrypted = await decryptBundle(encrypted.bundle, "correct horse");
    expect(decrypted).toEqual({ plaintext: "hello world" });
  });

  it("uses a fresh salt and IV every time", async () => {
    const first = await encryptText("same", "pass", ITERATIONS);
    const second = await encryptText("same", "pass", ITERATIONS);
    if ("error" in first || "error" in second) throw new Error("encryption failed");
    expect(first.bundle).not.toBe(second.bundle);
  });

  it("rejects a wrong passphrase", async () => {
    const encrypted = await encryptText("secret", "right", ITERATIONS);
    if ("error" in encrypted) throw new Error(encrypted.error);
    const decrypted = await decryptBundle(encrypted.bundle, "wrong");
    expect(decrypted).toMatchObject({ error: expect.stringContaining("Decryption failed") });
  });

  it("rejects tampered bundles", async () => {
    const encrypted = await encryptText("secret", "right", ITERATIONS);
    if ("error" in encrypted) throw new Error(encrypted.error);
    const tampered = `${encrypted.bundle.slice(0, -4)}AAAA`;
    const decrypted = await decryptBundle(tampered, "right");
    expect(decrypted).toMatchObject({ error: expect.any(String) });
  });

  it("rejects malformed bundles", async () => {
    expect(await decryptBundle("not-base64!!", "pass")).toMatchObject({ error: expect.any(String) });
    expect(await decryptBundle("", "pass")).toMatchObject({ error: expect.any(String) });
  });

  it("validates inputs", async () => {
    expect(await encryptText("", "pass", ITERATIONS)).toMatchObject({ error: expect.stringContaining("text to encrypt") });
    expect(await encryptText("hi", "", ITERATIONS)).toMatchObject({ error: expect.stringContaining("passphrase") });
    expect(await encryptText("hi", "pass", 100)).toMatchObject({ error: expect.stringContaining("Iterations") });
    expect(await deriveKey("", new Uint8Array(16), ITERATIONS)).toMatchObject({ error: expect.any(String) });
  });

  it("handles unicode text", async () => {
    const encrypted = await encryptText("héllo 🌍", "päss", ITERATIONS);
    if ("error" in encrypted) throw new Error(encrypted.error);
    expect(await decryptBundle(encrypted.bundle, "päss")).toEqual({ plaintext: "héllo 🌍" });
  });
});
