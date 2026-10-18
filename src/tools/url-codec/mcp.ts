import { z } from "zod";
import { decodeUrl, encodeModes, encodeUrl, parseUrl, serializeQuery } from "@/tools/url-codec/lib/url";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  action: z.enum(["encode", "decode", "parse"]).default("parse"),
  value: z.string(),
  mode: z.enum(encodeModes).default("component"),
  plusAsSpace: z.boolean().default(false).describe("When decoding, treat + as a space."),
});

export const outputSchema = z.object({
  value: z.string(),
  protocol: z.string(),
  username: z.string(),
  hostname: z.string(),
  port: z.string(),
  pathname: z.string(),
  hash: z.string(),
  query: z.string(),
  params: z.array(z.object({ key: z.string(), value: z.string() })),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  if (parsed.action === "encode") {
    return outputSchema.parse(emptyParts(encodeUrl(parsed.value, parsed.mode)));
  }
  if (parsed.action === "decode") {
    const decoded = decodeUrl(parsed.value, parsed.plusAsSpace);
    if ("error" in decoded) throw new Error(decoded.error);
    return outputSchema.parse(emptyParts(decoded.value));
  }
  const url = parseUrl(parsed.value);
  if ("error" in url) throw new Error(url.error);
  return outputSchema.parse({ ...url, value: url.href, query: serializeQuery(url.params) });
}

export const tool: BenchTool = {
  slug: "url-codec",
  name: "url_codec",
  title: "Encode, decode, or parse a URL",
  description: "Percent-encode or decode text, or parse a URL into its host, path, hash, and query parameters.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};

function emptyParts(value: string) {
  return { value, protocol: "", username: "", hostname: "", port: "", pathname: "", hash: "", query: "", params: [] };
}
