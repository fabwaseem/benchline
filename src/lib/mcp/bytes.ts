import { decodeBase64 } from "@/lib/base64";
import { assertPublicHost, parsePublicHttpUrl, PublicUrlError } from "@/lib/net/ssrf";
import { z } from "zod";

export const MCP_MAX_BYTES = 10 * 1024 * 1024;
export const MCP_MAX_TEXT = Math.ceil(MCP_MAX_BYTES / 3) * 4 + 128;

const REDIRECT_LIMIT = 4;

export type McpBytes = {
  bytes: Uint8Array;
  filename: string;
  mimeType: string;
};

function fileObject<Extra extends z.ZodRawShape>(extra: Extra) {
  return z
    .object({
      url: z.string().optional().describe("Public http or https URL. Private and local addresses are refused."),
      data: z.string().optional().describe("Base64 bytes or a data URI. Decoded size is capped at 10 MB."),
      mimeType: z.string().optional().describe("MIME type when you know it."),
      filename: z.string().optional().describe("File name, including the extension when you have one."),
      ...extra,
    })
    .superRefine((value, ctx) => {
      const record = value as { url?: unknown; data?: unknown };
      const hasUrl = typeof record.url === "string" && record.url.trim().length > 0;
      const hasData = typeof record.data === "string" && record.data.trim().length > 0;
      if (hasUrl === hasData) {
        ctx.addIssue({
          code: "custom",
          message: "Provide either url or data.",
          path: [hasData ? "url" : "data"],
        });
      }
    });
}

export const mcpFileSchema = fileObject({});

export const pdfFileSchema = fileObject({
  name: z.string().default("document.pdf"),
  pages: z.string().default("").describe("Pages to keep, such as 1-3,5. Blank keeps every page."),
});

type FileFields = {
  url?: string;
  data?: string;
  mimeType?: string;
  filename?: string;
};

export async function readMcpBytes(file: FileFields, label = "File"): Promise<McpBytes> {
  const url = file.url?.trim() ?? "";
  const data = file.data?.trim() ?? "";
  if (url && data) throw new Error(`${label}: provide url or data, not both.`);
  if (!url && !data) throw new Error(`${label}: provide url or data.`);
  if (data) return bytesFromData(data, label, file.filename, file.mimeType);
  return bytesFromUrl(url, label, file.filename, file.mimeType);
}

function bytesFromData(value: string, label: string, filename?: string, mimeType?: string): McpBytes {
  if (value.length > MCP_MAX_TEXT) throw new Error(`${label} is larger than 10 MB.`);
  const dataUri = /^data:([^;,]+);base64,/i.exec(value.trim());
  const bytes = decodeBase64(value, label);
  if (bytes.byteLength > MCP_MAX_BYTES) throw new Error(`${label} is larger than 10 MB.`);
  return {
    bytes,
    filename: filename?.trim() || "file",
    mimeType: mimeType?.trim() || dataUri?.[1]?.trim() || "",
  };
}

async function bytesFromUrl(input: string, label: string, filename?: string, mimeType?: string): Promise<McpBytes> {
  let current = parsePublicHttpUrl(input);
  for (let hop = 0; hop <= REDIRECT_LIMIT; hop += 1) {
    await assertPublicHost(current);
    const response = await fetch(current, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
      headers: {
        accept: "*/*",
        "user-agent": "Benchline/1.0 (+https://tools.fabwaseem.com)",
      },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new PublicUrlError("Redirect was missing a location.");
      if (hop === REDIRECT_LIMIT) throw new PublicUrlError("Too many redirects.");
      current = parsePublicHttpUrl(new URL(location, current).toString());
      continue;
    }
    if (response.status >= 400) throw new Error(`${label} returned ${response.status}.`);
    const declared = Number(response.headers.get("content-length") ?? "");
    if (Number.isFinite(declared) && declared > MCP_MAX_BYTES) throw new Error(`${label} is larger than 10 MB.`);
    const bytes = await readLimited(response, label);
    const headerType = (response.headers.get("content-type") ?? "").split(";")[0]?.trim() ?? "";
    return {
      bytes,
      filename: filename?.trim() || nameFromUrl(current),
      mimeType: mimeType?.trim() || headerType,
    };
  }
  throw new PublicUrlError("Too many redirects.");
}

async function readLimited(response: Response, label: string) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error(`${label} was empty.`);
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > MCP_MAX_BYTES) {
      await reader.cancel();
      throw new Error(`${label} is larger than 10 MB.`);
    }
    chunks.push(value);
  }
  if (total === 0) throw new Error(`${label} was empty.`);
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function nameFromUrl(url: URL) {
  const last = url.pathname.split("/").filter(Boolean).pop() ?? "";
  if (!last) return "file";
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}
