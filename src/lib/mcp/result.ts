import { z } from "zod";

/**
 * Some tools report a failure inside their result ({ ok: false, error }) so the browser UI can show it.
 * Over MCP that must also set isError, or agents and clients treat the call as a success.
 * A validator's `valid: false` is an answer, not a failure, and is left alone.
 */
export function failureOf(structured: unknown): string | null {
  if (!structured || typeof structured !== "object" || Array.isArray(structured)) return null;
  const record = structured as Record<string, unknown>;
  if (record.ok !== false) return null;
  return typeof record.error === "string" && record.error.trim() ? record.error.trim() : "The tool could not handle this input.";
}

const BINARY_MIN = 1024;
const BASE64 = /^[A-Za-z0-9+/_-]+={0,2}$/;
const DATA_URI = /^data:([\w.+-]+\/[\w.+-]+)?(;[\w-]+=[^;,]+)*;base64,/;

function isBinaryString(value: string) {
  if (value.length < BINARY_MIN) return false;
  if (DATA_URI.test(value)) return true;
  // Sample the start so a 30 MB string is not scanned twice; base64 has no spaces or newlines.
  return BASE64.test(value.slice(0, 4096)) && !/\s/.test(value.slice(0, 4096));
}

function sizeLabel(chars: number) {
  const bytes = Math.round((chars * 3) / 4);
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * The text copy of a result for clients that read `content` instead of `structuredContent`.
 * Base64 files are replaced with a pointer, so a 300 KB image is not sent twice.
 */
export function textCopy(structured: unknown): string {
  const walk = (value: unknown, path: string): unknown => {
    if (typeof value === "string") {
      return isBinaryString(value) ? `<base64, about ${sizeLabel(value.length)}: full value in structuredContent.${path}>` : value;
    }
    if (Array.isArray(value)) return value.map((item, index) => walk(item, `${path}[${index}]`));
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, walk(item, path ? `${path}.${key}` : key)]));
    }
    return value;
  };
  return JSON.stringify(walk(structured, ""));
}

/** Rejects argument names the tool does not know, so a typo errors instead of being ignored. */
export function strictInput<T extends z.ZodType>(schema: T): T {
  return (schema instanceof z.ZodObject ? schema.strict() : schema) as T;
}
