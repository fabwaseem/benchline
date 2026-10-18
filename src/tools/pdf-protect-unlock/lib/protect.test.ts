import { PDFDocument } from "@cantoo/pdf-lib";
import { describe, expect, it } from "vitest";
import { protectPdf } from "@/tools/pdf-protect-unlock/lib/protect";

async function plainPdf() {
  const doc = await PDFDocument.create();
  doc.addPage([200, 200]);
  return new Uint8Array(await doc.save());
}

function bufferOf(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

describe("protectPdf", () => {
  it("encrypts with a password and opens again only with that password", async () => {
    const locked = await protectPdf(await plainPdf(), { action: "protect", password: "secret" });
    expect(locked.encrypted).toBe(true);
    await expect(PDFDocument.load(bufferOf(locked.bytes))).rejects.toThrow(/encrypt/i);
    const opened = await PDFDocument.load(bufferOf(locked.bytes), { password: "secret" });
    expect(opened.getPageCount()).toBe(1);
    await expect(protectPdf(locked.bytes, { action: "unlock", password: "nope" })).rejects.toThrow(/did not open/);
  });

  it("writes an unlocked PDF that opens without a password", async () => {
    const locked = await protectPdf(await plainPdf(), { action: "protect", password: "secret", ownerPassword: "owner" });
    const opened = await protectPdf(locked.bytes, { action: "unlock", password: "secret" });
    expect(opened.encrypted).toBe(false);
    const doc = await PDFDocument.load(bufferOf(opened.bytes));
    expect(doc.getPageCount()).toBe(1);
  });

  it("refuses to protect a file that is already encrypted", async () => {
    const locked = await protectPdf(await plainPdf(), { action: "protect", password: "secret" });
    await expect(protectPdf(locked.bytes, { action: "protect", password: "other" })).rejects.toThrow(/Unlock it first/);
  });
});
