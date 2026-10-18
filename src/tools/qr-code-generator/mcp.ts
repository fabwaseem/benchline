import { z } from "zod";
import type { BenchTool } from "@/lib/mcp/types";
import { eccLevels, qrPayload, qrTypes, renderQr, wifiSecurities, type QrRequest } from "@/tools/qr-code-generator/lib/qr";

const wifiSchema = z.object({
  ssid: z.string().default(""),
  password: z.string().default(""),
  security: z.enum(wifiSecurities).default("WPA"),
  hidden: z.boolean().default(false),
});

const vcardSchema = z.object({
  name: z.string().default(""),
  phone: z.string().default(""),
  email: z.string().default(""),
  org: z.string().default(""),
  title: z.string().default(""),
  url: z.string().default(""),
});

export const inputSchema = z.object({
  type: z.enum(qrTypes).default("url"),
  text: z.string().default(""),
  url: z.string().default(""),
  wifi: wifiSchema.default({ ssid: "", password: "", security: "WPA", hidden: false }),
  vcard: vcardSchema.default({ name: "", phone: "", email: "", org: "", title: "", url: "" }),
  ecc: z.enum(eccLevels).default("M"),
  dark: z.string().default("#111111"),
  light: z.string().default("#ffffff"),
  margin: z.number().int().min(0).max(8).default(2),
  size: z.number().int().min(128).max(2048).default(512),
});

export const outputSchema = z.object({
  payload: z.string(),
  svg: z.string(),
  pngBase64: z.string(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const request: QrRequest = {
    type: parsed.type,
    text: parsed.text,
    url: parsed.url,
    wifi: parsed.wifi,
    vcard: parsed.vcard,
  };
  const payload = qrPayload(request);
  const rendered = await renderQr(payload, parsed);
  return outputSchema.parse({ payload, ...rendered });
}

export const tool: BenchTool = {
  slug: "qr-code-generator",
  name: "generate_qr_code",
  title: "Generate a QR code",
  description: "Build a static QR code for text, a URL, Wi-Fi, or a vCard. Returns the payload, an SVG string, and a PNG as base64.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
