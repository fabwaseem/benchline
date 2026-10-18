import { assertByteSize } from "@/lib/format";
import { pdfFailure } from "@/lib/pdf-error";

export const protectActions = ["protect", "unlock"] as const;
export type ProtectAction = (typeof protectActions)[number];

export type PdfPermissions = {
  printing: boolean;
  copying: boolean;
  modifying: boolean;
  annotating: boolean;
  fillingForms: boolean;
  contentAccessibility: boolean;
  documentAssembly: boolean;
};

export const defaultPermissions: PdfPermissions = {
  printing: true,
  copying: false,
  modifying: false,
  annotating: false,
  fillingForms: true,
  contentAccessibility: true,
  documentAssembly: false,
};

function pdfBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

export async function protectPdf(
  data: Uint8Array,
  input: {
    action: ProtectAction;
    password: string;
    ownerPassword?: string;
    permissions?: Partial<PdfPermissions>;
  },
) {
  assertByteSize(data, "This PDF");
  const password = input.password.trim();
  if (!password) {
    throw new Error(input.action === "unlock" ? "Enter the password that opens this PDF." : "Enter a user password.");
  }
  if (password.length > 128) throw new Error("The password is longer than 128 characters.");
  const { PDFDocument } = await import("@cantoo/pdf-lib");
  try {
    if (input.action === "unlock") {
      const locked = await PDFDocument.load(pdfBuffer(data), { password });
      const fresh = await PDFDocument.create();
      const copied = await fresh.copyPages(locked, locked.getPageIndices());
      for (const page of copied) fresh.addPage(page);
      const saved = await fresh.save();
      return { bytes: new Uint8Array(saved), encrypted: false };
    }
    let doc;
    try {
      doc = await PDFDocument.load(pdfBuffer(data));
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (/encrypted/i.test(message)) throw new Error("This PDF is already encrypted. Unlock it first, then protect it.");
      throw error;
    }
    const owner = input.ownerPassword?.trim() || password;
    if (owner.length > 128) throw new Error("The owner password is longer than 128 characters.");
    const permissions = { ...defaultPermissions, ...input.permissions };
    doc.encrypt({
      userPassword: password,
      ownerPassword: owner,
      permissions: {
        printing: permissions.printing ? "highResolution" : false,
        copying: permissions.copying,
        modifying: permissions.modifying,
        annotating: permissions.annotating,
        fillingForms: permissions.fillingForms,
        contentAccessibility: permissions.contentAccessibility,
        documentAssembly: permissions.documentAssembly,
      },
    });
    const saved = await doc.save();
    return { bytes: new Uint8Array(saved), encrypted: true };
  } catch (error) {
    if (error instanceof Error && /Unlock it first|128 characters|Enter /.test(error.message)) throw error;
    const message = error instanceof Error ? error.message : "";
    if (/password incorrect/i.test(message)) throw new Error("That password did not open this PDF.");
    throw new Error(pdfFailure(error));
  }
}
