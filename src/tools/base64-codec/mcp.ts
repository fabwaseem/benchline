import { z } from "zod";
import { decodeBase64, encodeText } from "@/tools/base64-codec/lib/codec";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  action: z.enum(["encode", "decode"]).default("encode"),
  text: z.string().describe("Text to encode, or Base64 or a data URI to decode."),
  urlSafe: z.boolean().default(false).describe("Encode with the URL-safe alphabet and no padding. Data URIs stay on the standard alphabet."),
  dataUri: z.boolean().default(false),
  mime: z.string().default("text/plain;charset=utf-8"),
});

export const outputSchema = z.object({
  ok: z.boolean(),
  error: z.string(),
  output: z.string(),
  mime: z.string(),
  filename: z.string(),
  binary: z.boolean(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  if (parsed.action === "encode") {
    return outputSchema.parse({
      ok: true,
      error: "",
      output: encodeText(parsed.text, parsed),
      mime: parsed.dataUri ? parsed.mime : "",
      filename: "",
      binary: false,
    });
  }
  const decoded = decodeBase64(parsed.text);
  if (!decoded.ok) {
    return outputSchema.parse({ ok: false, error: decoded.error, output: "", mime: "", filename: "", binary: false });
  }
  return outputSchema.parse({
    ok: true,
    error: "",
    output: decoded.text ?? "",
    mime: decoded.mime,
    filename: decoded.filename,
    binary: decoded.text === null,
  });
}

export const tool: BenchTool = {
  slug: "base64-codec",
  name: "base64_codec",
  title: "Encode or decode Base64",
  description: "Encode UTF-8 text as Base64, or decode Base64 and data URIs. URL-safe output uses - and _ and omits padding. Decode reports the sniffed media type and whether the bytes are UTF-8 text.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
