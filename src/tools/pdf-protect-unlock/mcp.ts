import { z } from "zod";
import { encodeBase64 } from "@/lib/base64";
import { readMcpBytes } from "@/lib/mcp/bytes";
import type { BenchTool } from "@/lib/mcp/types";
import { defaultPermissions, protectActions, protectPdf } from "@/tools/pdf-protect-unlock/lib/protect";

export const inputSchema = z.object({
  data: z.string().optional().describe("PDF bytes as base64 or a data URI. Decoded size is capped at 10 MB. Provide data or url."),
  url: z.string().optional().describe("Public URL of a PDF. Private and local addresses are refused. Provide data or url."),
  filename: z.string().optional(),
  mimeType: z.string().optional(),
  action: z.enum(protectActions).default("protect"),
  password: z.string().default("").describe("User password. Required to protect or unlock. Unlock only works when this is the known password."),
  ownerPassword: z.string().default("").describe("Owner password. Blank uses the user password."),
  permissions: z.object({
    printing: z.boolean().default(defaultPermissions.printing),
    copying: z.boolean().default(defaultPermissions.copying),
    modifying: z.boolean().default(defaultPermissions.modifying),
    annotating: z.boolean().default(defaultPermissions.annotating),
    fillingForms: z.boolean().default(defaultPermissions.fillingForms),
    contentAccessibility: z.boolean().default(defaultPermissions.contentAccessibility),
    documentAssembly: z.boolean().default(defaultPermissions.documentAssembly),
  }).default(defaultPermissions),
});

export const outputSchema = z.object({
  data: z.string().describe("PDF bytes as base64."),
  bytes: z.number().int(),
  encrypted: z.boolean(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const file = await readMcpBytes(parsed, "This PDF");
  const result = await protectPdf(file.bytes, {
    action: parsed.action,
    password: parsed.password,
    ownerPassword: parsed.ownerPassword,
    permissions: parsed.permissions,
  });
  return outputSchema.parse({
    data: encodeBase64(result.bytes),
    bytes: result.bytes.byteLength,
    encrypted: result.encrypted,
  });
}

export const tool: BenchTool = {
  slug: "pdf-protect-unlock",
  name: "protect_pdf",
  title: "Protect or unlock a PDF",
  description: "Protect a PDF with AES-256, or unlock one when the password is known. action is protect or unlock. password is the user password. ownerPassword is optional. permissions cover printing, copying, modifying, annotating, filling forms, accessibility, and assembly. Send base64 or a public URL. Private addresses are refused.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
