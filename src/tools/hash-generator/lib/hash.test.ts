import { describe, expect, it } from "vitest";
import { encodeText, hashAll, hashesEqual, hmac, md5, bytesToHex, matchingAlgorithms } from "@/tools/hash-generator/lib/hash";

describe("hash generator", () => {
  it("matches known MD5, SHA-1, SHA-256, and SHA-512 vectors", async () => {
    expect(bytesToHex(md5(encodeText("")))).toBe("d41d8cd98f00b204e9800998ecf8427e");
    expect(bytesToHex(md5(encodeText("abc")))).toBe("900150983cd24fb0d6963f7d28e17f72");
    expect(bytesToHex(md5(encodeText("abcdefghijklmnopqrstuvwxyz")))).toBe("c3fcd3d76192e4007dfb496cca67e13b");
    const rows = await hashAll(encodeText("abc"));
    expect(rows.find((row) => row.algorithm === "SHA-1")?.hex).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
    expect(rows.find((row) => row.algorithm === "SHA-256")?.hex).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(rows.find((row) => row.algorithm === "SHA-512")?.hex).toBe(
      "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f",
    );
    expect(rows.find((row) => row.algorithm === "MD5")?.base64).toBe("kAFQmDzST7DWlj99KOF/cg==");
  });

  it("computes HMAC and matches a checksum with colons or mixed case", async () => {
    expect(bytesToHex(await hmac(encodeText("Hi There"), new Uint8Array(16).fill(0x0b), "MD5"))).toBe("9294727a3638bb1c13f48ef8158bfc9d");
    expect(bytesToHex(await hmac(encodeText("what do ya want for nothing?"), encodeText("Jefe"), "SHA-256"))).toBe(
      "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843",
    );
    const rows = await hashAll(encodeText("abc"));
    expect(hashesEqual(rows[2]?.hex ?? "", "BA78:16BF:8F01:CFEA:4141:40DE:5DAE:2223:B003:61A3:9617:7A9C:B410:FF61:F200:15AD")).toBe(true);
    expect(matchingAlgorithms(rows, "900150983cd24fb0d6963f7d28e17f72")).toEqual(["MD5"]);
    expect(matchingAlgorithms(rows, "nope")).toEqual([]);
  });
});
